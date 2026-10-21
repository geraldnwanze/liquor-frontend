"use server";

import { commerceRequest, type CommerceResponse } from "@/lib/api/commerce";
import { toError } from "@/lib/api/result";
import { clientIp, clearSession, getSessionToken, setSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/safe-next";
import type { FormState } from "@/lib/auth/form-state";
import { clearGuestCart, getCartToken } from "@/lib/cart/cookie";

const text = (fd: FormData, key: string, max = 190): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.slice(0, max) : "";
};

const NETWORK: FormState = { status: "error", message: "We couldn't reach the shop. Check your connection and try again." };

/** Turns an API failure into something a person can act on. */
function failure(res: CommerceResponse, fd: FormData, keep: string[]): FormState {
  const values = Object.fromEntries(keep.map((k) => [k, text(fd, k)]));
  const err = toError(res);
  if (err.code === "rate_limited") return { status: "error", message: "Too many attempts. Please wait a minute and try again.", values };
  // Wrong credentials come back as a validation error on `email`; show it as one clear message, not under a field.
  const credentials = err.fieldErrors?.email?.[0];
  if (res.status === 422 && credentials && /credentials/i.test(credentials)) return { status: "error", message: credentials, values };
  return { status: "error", message: err.message, fieldErrors: err.fieldErrors, values };
}

async function startSession(res: CommerceResponse, next: string): Promise<FormState> {
  const data = (res.json as { data?: { token?: string; expires_at?: string } } | null)?.data;
  if (!data?.token || !data.expires_at) return { status: "error", message: "Something went wrong. Please try again." };

  await setSession(data.token, new Date(data.expires_at));
  // The server merged any guest cart into this customer's cart; the guest token is now stale.
  await clearGuestCart(true);
  return { status: "success", redirectTo: safeNext(next) };
}

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await commerceRequest("POST", "/auth/login", {
    token: await getCartToken(),
    forwardedFor: await clientIp(),
    body: { email: text(fd, "email"), password: text(fd, "password", 200) },
  });
  if (!res) return NETWORK;
  return res.status === 200 ? startSession(res, text(fd, "next", 300)) : failure(res, fd, ["email"]);
}

export async function registerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await commerceRequest("POST", "/auth/register", {
    token: await getCartToken(),
    forwardedFor: await clientIp(),
    body: {
      name: text(fd, "name", 120),
      email: text(fd, "email"),
      phone: text(fd, "phone", 30) || undefined,
      password: text(fd, "password", 200),
      password_confirmation: text(fd, "password_confirmation", 200),
    },
  });
  if (!res) return NETWORK;
  return res.status === 201 ? startSession(res, text(fd, "next", 300)) : failure(res, fd, ["name", "email", "phone"]);
}

/** Ends the session on the server (the token stops working everywhere) and forgets it in this browser. */
export async function logoutAction(): Promise<void> {
  const bearer = await getSessionToken();
  if (bearer) await commerceRequest("POST", "/auth/logout", { bearer });
  await clearSession();
  await clearGuestCart(false);
}

export async function forgotPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await commerceRequest("POST", "/auth/forgot-password", { forwardedFor: await clientIp(), body: { email: text(fd, "email") } });
  if (!res) return NETWORK;
  if (res.status !== 200) return failure(res, fd, ["email"]);
  // The API answers identically whether or not the email has an account; so do we.
  return { status: "success", message: "If an account exists for that email, we've sent a link to reset the password. It may take a few minutes to arrive." };
}

export async function resetPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await commerceRequest("POST", "/auth/reset-password", {
    forwardedFor: await clientIp(),
    body: {
      email: text(fd, "email"),
      token: text(fd, "token", 200),
      password: text(fd, "password", 200),
      password_confirmation: text(fd, "password_confirmation", 200),
    },
  });
  if (!res) return NETWORK;
  return res.status === 200 ? { status: "success", redirectTo: "/login?reset=1" } : failure(res, fd, []);
}
