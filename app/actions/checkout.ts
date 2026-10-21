"use server";

import { commerceRequest } from "@/lib/api/commerce";
import { networkError, toOrderResult, type OrderResult } from "@/lib/api/result";
import { getSessionToken } from "@/lib/auth/session";
import { getCartToken } from "@/lib/cart/cookie";
import { isValidAttemptKey } from "@/lib/checkout/attempt-key";

export interface CheckoutInput {
  idempotencyKey: string;
  name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  deliveryInstructions: string;
  ageConfirmed: boolean;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/**
 * Places the order. The browser sends only who/where; items, prices, delivery fee and totals are all computed by
 * Laravel from the cart it holds server-side. Safe to retry with the same idempotency key.
 */
export async function placeOrderAction(input: CheckoutInput): Promise<OrderResult> {
  const idempotencyKey = str(input?.idempotencyKey, 64);
  if (!isValidAttemptKey(idempotencyKey)) return { ok: false, code: "validation", message: "Please try submitting again." };

  const [token, bearer] = await Promise.all([getCartToken(), getSessionToken()]);
  if (!token && !bearer) return { ok: false, code: "cart_empty", message: "Your cart is empty." };

  const res = await commerceRequest("POST", "/checkout", {
    token,
    bearer,
    idempotencyKey,
    body: {
      name: str(input.name, 120),
      email: str(input.email, 190),
      phone: str(input.phone, 30),
      state: str(input.state, 80),
      city: str(input.city, 80),
      address: str(input.address, 255),
      delivery_instructions: str(input.deliveryInstructions, 500),
      age_confirmed: input.ageConfirmed === true,
    },
  });

  return res ? toOrderResult(res) : networkError();
}
