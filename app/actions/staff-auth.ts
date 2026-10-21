"use server";

import { commerceRequest } from "@/lib/api/commerce";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { safeNext } from "@/lib/auth/safe-next";
import { clearStaffSession, clientIp, getStaffToken, setStaffSession } from "@/lib/auth/session";

const text = (fd: FormData, key: string, max = 190): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.slice(0, max) : "";
};

/** Staff sign-in. Sets the staff session only; it never touches the customer session or cart. */
export async function staffLoginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await commerceRequest("POST", "/auth/staff/login", {
    forwardedFor: await clientIp(),
    body: { email: text(fd, "email"), password: text(fd, "password", 200) },
  });
  if (!res) return { status: "error", message: "We couldn't reach the server. Check your connection and try again.", values: { email: text(fd, "email") } };

  if (res.status !== 200) {
    const err = toError(res);
    const message = err.code === "rate_limited" ? "Too many attempts. Please wait a minute and try again." : (err.fieldErrors?.email?.[0] ?? err.message);
    return { status: "error", message, values: { email: text(fd, "email") } };
  }
  const data = (res.json as { data?: { token?: string; expires_at?: string } } | null)?.data;
  if (!data?.token || !data.expires_at) return { status: "error", message: "Something went wrong. Please try again." };

  await setStaffSession(data.token, new Date(data.expires_at));
  const next = safeNext(text(fd, "next", 300));
  return { status: "success", redirectTo: next.startsWith("/admin") ? next : "/admin" };
}

/** Ends the staff session on the server (the token stops working everywhere) and in this browser. */
export async function staffLogoutAction(): Promise<void> {
  const bearer = await getStaffToken();
  if (bearer) await commerceRequest("POST", "/auth/logout", { bearer });
  await clearStaffSession();
}
