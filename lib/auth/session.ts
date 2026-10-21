import "server-only";
import { cookies } from "next/headers";

/*
 * The customer's API token lives in an httpOnly cookie held by our server, exactly like the guest cart token:
 * page scripts (and any XSS) can never read it. `lq_has_session` is a non-secret flag so the header can show
 * "Account" vs "Sign in" without making every cached page depend on who is looking at it.
 */
const SESSION_COOKIE = "lq_session";
const FLAG_COOKIE = "lq_has_session";
const TOKEN_FORMAT = /^[\w|-]{20,200}$/;

export async function getSessionToken(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value && TOKEN_FORMAT.test(value) ? value : null;
}

export async function setSession(token: string, expiresAt: Date): Promise<void> {
  if (!TOKEN_FORMAT.test(token)) return;
  const store = await cookies();
  const base = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", expires: expiresAt };
  store.set(SESSION_COOKIE, token, { ...base, httpOnly: true });
  store.set(FLAG_COOKIE, "1", { ...base, httpOnly: false });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(FLAG_COOKIE);
}

/*
 * Staff have their own session, separate from the customer's: a different cookie, set only by the staff portal
 * (/staff/login) and read only by the admin area. Being signed in to the shop gives no access to the admin, and
 * signing in as staff does not sign anyone in to the shop. There is no readable flag cookie: the shop never needs
 * to know.
 */
const STAFF_COOKIE = "lq_staff_session";

export async function getStaffToken(): Promise<string | null> {
  const value = (await cookies()).get(STAFF_COOKIE)?.value;
  return value && TOKEN_FORMAT.test(value) ? value : null;
}

export async function setStaffSession(token: string, expiresAt: Date): Promise<void> {
  if (!TOKEN_FORMAT.test(token)) return;
  (await cookies()).set(STAFF_COOKIE, token, { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", expires: expiresAt, httpOnly: true });
}

export async function clearStaffSession(): Promise<void> {
  (await cookies()).delete(STAFF_COOKIE);
}

export async function clientIp(): Promise<string | null> {
  const { headers } = await import("next/headers");
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || null;
}
