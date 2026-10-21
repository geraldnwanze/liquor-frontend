import "server-only";
import { cookies } from "next/headers";

/*
 * The guest cart token is a bearer secret for one cart, so it lives in an httpOnly cookie: page scripts (and any
 * XSS) can never read it, and it is only ever sent to our own server, which forwards it to the Laravel API.
 * `lq_has_cart` is a non-secret flag so the browser knows whether it is worth asking for the cart at all.
 */
const TOKEN_COOKIE = "lq_cart";
const FLAG_COOKIE = "lq_has_cart";
const MAX_AGE = 60 * 60 * 24 * 60; // matches the backend's guest cart retention (60 days)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getCartToken(): Promise<string | null> {
  const value = (await cookies()).get(TOKEN_COOKIE)?.value;
  return value && UUID.test(value) ? value : null;
}

export async function setCartToken(token: string): Promise<void> {
  if (!UUID.test(token)) return;
  const store = await cookies();
  const base = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: MAX_AGE };
  store.set(TOKEN_COOKIE, token, { ...base, httpOnly: true });
  store.set(FLAG_COOKIE, "1", { ...base, httpOnly: false });
}

/** After sign-in the guest cart has been merged into the customer's cart on the server: forget the guest token. */
export async function clearGuestCart(keepFlag: boolean): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  if (keepFlag) store.set(FLAG_COOKIE, "1", { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: MAX_AGE });
  else store.delete(FLAG_COOKIE);
}
