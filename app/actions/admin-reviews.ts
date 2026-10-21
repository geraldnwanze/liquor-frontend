"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { isUuid as isId } from "@/lib/ids";

const SLUG = /^[a-z0-9][a-z0-9-]{0,150}$/;

async function run(path: string, method: "POST" | "DELETE", productSlug: string, message: string): Promise<FormState> {
  const res = await adminWrite(method, path);
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  if (res.status < 200 || res.status >= 300) return { status: "error", message: toError(res).message };
  revalidatePath("/admin/reviews");
  if (SLUG.test(productSlug)) {
    updateTag(`reviews:${productSlug}`);
    updateTag(`product:${productSlug}`);
  }
  updateTag("products");
  return { status: "success", message };
}

export async function approveReviewAction(id: string, productSlug: string): Promise<FormState> {
  return isId(id) ? run(`/reviews/${id}/approve`, "POST", productSlug, "Review approved and now public.") : { status: "error", message: "That review wasn't found." };
}

export async function rejectReviewAction(id: string, productSlug: string): Promise<FormState> {
  return isId(id) ? run(`/reviews/${id}/reject`, "POST", productSlug, "Review rejected. It stays hidden.") : { status: "error", message: "That review wasn't found." };
}

export async function deleteReviewAction(id: string, productSlug: string): Promise<FormState> {
  return isId(id) ? run(`/reviews/${id}`, "DELETE", productSlug, "Review deleted.") : { status: "error", message: "That review wasn't found." };
}

export async function replyToReviewAction(id: string, productSlug: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(id)) return { status: "error", message: "That review wasn't found." };
  const raw = fd.get("reply");
  const reply = typeof raw === "string" ? raw.trim().slice(0, 1000) : "";
  const res = await adminWrite("PUT", `/reviews/${id}/reply`, { reply });
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  if (res.status !== 200) {
    const err = toError(res);
    return { status: "error", message: err.fieldErrors?.reply?.[0] ?? err.message };
  }
  revalidatePath("/admin/reviews");
  if (SLUG.test(productSlug)) updateTag(`reviews:${productSlug}`);
  return { status: "success", message: "Reply published under the review." };
}

export async function removeReviewReplyAction(id: string, productSlug: string): Promise<FormState> {
  return isId(id) ? run(`/reviews/${id}/reply`, "DELETE", productSlug, "Reply removed.") : { status: "error", message: "That review wasn't found." };
}
