"use server";

import { commerceRequest } from "@/lib/api/commerce";
import { networkError, toCartResult, type CartResult } from "@/lib/api/result";
import { EMPTY_CART } from "@/lib/cart/empty";
import { isUuid } from "@/lib/ids";
import { getSessionToken } from "@/lib/auth/session";
import { getCartToken, setCartToken } from "@/lib/cart/cookie";

async function cartRequest(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, opts: { query?: Record<string, string>; body?: unknown } = {}): Promise<CartResult> {
  const [token, bearer] = await Promise.all([getCartToken(), getSessionToken()]);
  const res = await commerceRequest(method, path, { ...opts, token, bearer });
  if (!res) return networkError();

  // A guest's first add creates the cart; remember its token (httpOnly) for next time.
  const issued = res.headers.get("x-cart-token");
  if (issued && issued !== token) await setCartToken(issued);

  return toCartResult(res);
}

const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) > 0;
const invalid = (): CartResult => ({ ok: false, code: "validation", message: "That request wasn't valid." });

export async function fetchCartAction(delivery?: { state: string; city: string }): Promise<CartResult> {
  // No cookie means no cart yet: answer locally instead of calling the API.
  if (!(await getCartToken()) && !(await getSessionToken())) return { ok: true, cart: EMPTY_CART };
  const query = delivery && delivery.state && delivery.city ? { state: String(delivery.state).slice(0, 80), city: String(delivery.city).slice(0, 80) } : undefined;
  return cartRequest("GET", "/cart", { query });
}

export async function addToCartAction(variantId: string, quantity: number): Promise<CartResult> {
  if (!isUuid(variantId) || !isCount(quantity) || quantity > 99) return invalid();
  return cartRequest("POST", "/cart/items", { body: { variant_id: variantId, quantity } });
}

export async function updateCartItemAction(itemId: string, quantity: number): Promise<CartResult> {
  if (!isUuid(itemId) || !isCount(quantity) || quantity > 99) return invalid();
  return cartRequest("PATCH", `/cart/items/${itemId}`, { body: { quantity } });
}

export async function removeCartItemAction(itemId: string): Promise<CartResult> {
  if (!isUuid(itemId)) return invalid();
  return cartRequest("DELETE", `/cart/items/${itemId}`);
}

const CODE_FORMAT = /^[A-Za-z0-9_-]{1,32}$/;

/** Applies a discount code to the cart. The server decides whether it works and by how much; nothing is trusted from here. */
export async function applyDiscountAction(code: string, delivery?: { state: string; city: string }): Promise<CartResult> {
  const clean = typeof code === "string" ? code.trim() : "";
  if (!CODE_FORMAT.test(clean)) return { ok: false, code: "discount_invalid", message: "That code isn't valid." };
  const query = delivery && delivery.state && delivery.city ? { state: String(delivery.state).slice(0, 80), city: String(delivery.city).slice(0, 80) } : undefined;
  return cartRequest("PUT", "/cart/discount", { body: { code: clean }, query });
}

export async function removeDiscountAction(delivery?: { state: string; city: string }): Promise<CartResult> {
  const query = delivery && delivery.state && delivery.city ? { state: String(delivery.state).slice(0, 80), city: String(delivery.city).slice(0, 80) } : undefined;
  return cartRequest("DELETE", "/cart/discount", { query });
}
