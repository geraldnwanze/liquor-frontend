import "server-only";
import { getSessionToken } from "@/lib/auth/session";
import { getCartToken } from "@/lib/cart/cookie";
import { commerceRequest } from "./commerce";
import type { Order, Receipt } from "./types";

/** The order, but only if this browser's cart or signed-in customer owns it (the API answers 404 otherwise). Never cached. */
export async function getMyOrder(reference: string): Promise<Order | null> {
  const [token, bearer] = await Promise.all([getCartToken(), getSessionToken()]);
  if ((!token && !bearer) || !/^[A-Z0-9]{8,16}$/.test(reference)) return null;
  const res = await commerceRequest("GET", `/orders/${reference}`, { token, bearer });
  if (!res || res.status !== 200) return null;
  return (res.json as { data: Order }).data;
}

/**
 * The receipt for an order this browser owns. `unavailable` means the order exists but is not paid yet; null means
 * it is not ours (or does not exist): the API gives both the same 404.
 */
export async function getMyReceipt(reference: string): Promise<Receipt | "unavailable" | null> {
  const [token, bearer] = await Promise.all([getCartToken(), getSessionToken()]);
  if ((!token && !bearer) || !/^[A-Z0-9]{8,16}$/.test(reference)) return null;
  const res = await commerceRequest("GET", `/orders/${reference}/receipt`, { token, bearer });
  if (!res) return null;
  if (res.status === 409) return "unavailable";
  return res.status === 200 ? (res.json as { data: Receipt }).data : null;
}
