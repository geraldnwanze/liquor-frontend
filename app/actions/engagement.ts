"use server";

import { updateTag } from "next/cache";
import { baseUrl } from "@/lib/api/client";
import { commerceRequest, type CommerceResponse } from "@/lib/api/commerce";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { getSessionToken } from "@/lib/auth/session";

const text = (fd: FormData, key: string, max: number): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const SLUG = /^[a-z0-9][a-z0-9-]{0,150}$/;
const NETWORK: FormState = { status: "error", message: "We couldn't reach the shop. Check your connection and try again." };
const SIGNED_OUT: FormState = { status: "error", message: "Please sign in to continue." };

async function authed(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<CommerceResponse | "signed-out" | null> {
  const bearer = await getSessionToken();
  if (!bearer) return "signed-out";
  const res = await commerceRequest(method, path, { bearer, body });
  return res?.status === 401 ? "signed-out" : res;
}

/** Slugs the signed-in customer has saved. Empty for guests. Personal, so never cached. */
export async function getWishlistSlugsAction(): Promise<string[]> {
  const res = await authed("GET", "/me/wishlist/slugs");
  if (res === "signed-out" || !res || res.status !== 200) return [];
  const data = (res.json as { data?: unknown })?.data;
  return Array.isArray(data) ? data.filter((s): s is string => typeof s === "string") : [];
}

/** Saves or removes a product. Returns "signed-out" so the caller can send the visitor to sign in. */
export async function setWishlistAction(slug: string, saved: boolean): Promise<"ok" | "signed-out" | "error"> {
  if (!SLUG.test(slug)) return "error";
  const res = await authed(saved ? "PUT" : "DELETE", `/me/wishlist/${slug}`);
  if (res === "signed-out") return "signed-out";
  return res && (res.status === 201 || res.status === 204) ? "ok" : "error";
}

export type ReviewEligibility = { can_review: boolean; review: { rating: number; title: string | null; body: string; status: string } | null } | null;

/** What this visitor may do on a product: write a review, see their own, or neither. Null for guests. */
export async function getReviewEligibilityAction(slug: string): Promise<ReviewEligibility> {
  if (!SLUG.test(slug)) return null;
  const res = await authed("GET", `/me/products/${slug}/review`);
  if (res === "signed-out" || !res || res.status !== 200) return null;
  return (res.json as { data: ReviewEligibility }).data;
}

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export async function submitReviewAction(slug: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!SLUG.test(slug)) return { status: "error", message: "That product wasn't found." };
  const bearer = await getSessionToken();
  if (!bearer) return SIGNED_OUT;

  const form = new FormData();
  form.set("rating", String(Number(text(fd, "rating", 1)) || 0));
  form.set("title", text(fd, "title", 120));
  form.set("body", text(fd, "body", 2000));
  // Empty file inputs arrive as zero-byte files; the API re-checks type, size and dimensions of the rest.
  const photos = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_PHOTOS) return { status: "error", message: `You can add up to ${MAX_PHOTOS} photos.` };
  if (photos.some((f) => f.size > MAX_PHOTO_BYTES)) return { status: "error", message: "Each photo must be 5 MB or smaller." };
  for (const photo of photos) form.append("photos[]", photo);

  let res: CommerceResponse | null = null;
  try {
    const r = await fetch(`${baseUrl()}/products/${slug}/reviews`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${bearer}` },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    res = { status: r.status, json: await r.json().catch(() => null), headers: r.headers };
  } catch {
    return NETWORK;
  }
  if (res.status === 401) return SIGNED_OUT;
  if (res.status === 201) return { status: "success", message: (res.json as { message?: string })?.message ?? "Thank you! Your review will appear once approved." };
  const err = toError(res);
  // Laravel names photo errors "photos.0"; show them together under the photo field.
  const photoErrors = Object.entries(err.fieldErrors ?? {}).filter(([k]) => k.startsWith("photos")).flatMap(([, v]) => v);
  return { status: "error", message: err.message, fieldErrors: { ...err.fieldErrors, ...(photoErrors.length ? { photos: photoErrors } : {}) } };
}

/** Takes the signed-in customer's own review down (photos included). */
export async function deleteMyReviewAction(slug: string): Promise<FormState> {
  if (!SLUG.test(slug)) return { status: "error", message: "That product wasn't found." };
  const res = await authed("DELETE", `/me/products/${slug}/review`);
  if (res === "signed-out") return SIGNED_OUT;
  if (!res) return NETWORK;
  if (res.status !== 204) return { status: "error", message: toError(res).message };
  updateTag(`reviews:${slug}`);
  updateTag("products");
  return { status: "success", message: "Your review has been removed." };
}

export async function subscribeNewsletterAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await commerceRequest("POST", "/newsletter", { body: { email: text(fd, "email", 190), consent: fd.get("consent") === "on" } });
  if (!res) return NETWORK;
  if (res.status === 202) return { status: "success", message: (res.json as { message?: string })?.message ?? "Check your inbox to confirm." };
  const err = toError(res);
  return { status: "error", message: err.fieldErrors?.consent?.[0] ?? err.fieldErrors?.email?.[0] ?? err.message, fieldErrors: err.fieldErrors };
}

async function newsletterToken(path: "/newsletter/confirm" | "/newsletter/unsubscribe", token: string): Promise<FormState> {
  if (!/^[A-Za-z0-9]{1,64}$/.test(token)) return { status: "error", message: "This link is not valid." };
  const res = await commerceRequest("POST", path, { body: { token } });
  if (!res) return NETWORK;
  const message = (res.json as { message?: string })?.message;
  return res.status === 200 ? { status: "success", message } : { status: "error", message: message ?? "This link is not valid." };
}

export async function confirmNewsletterAction(token: string): Promise<FormState> {
  return newsletterToken("/newsletter/confirm", token);
}

export async function unsubscribeNewsletterAction(token: string): Promise<FormState> {
  return newsletterToken("/newsletter/unsubscribe", token);
}

export async function refreshReviews(slug: string): Promise<void> {
  updateTag(`reviews:${slug}`);
}
