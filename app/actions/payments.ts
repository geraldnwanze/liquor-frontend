"use server";

import { commerceRequest } from "@/lib/api/commerce";
import { networkError, toPaymentResult, type PaymentResult } from "@/lib/api/result";
import { getSessionToken } from "@/lib/auth/session";
import { getCartToken } from "@/lib/cart/cookie";
import { isPaymentReference } from "@/lib/payments/polling";

async function identity() {
  const [token, bearer] = await Promise.all([getCartToken(), getSessionToken()]);
  return { token, bearer };
}

/**
 * Starts a payment for an order and returns the gateway's page to send the customer to. The browser says only which
 * order and which method: the amount is the order's total, read by Laravel from its own records.
 */
export async function startPaymentAction(orderReference: string, gateway: string): Promise<PaymentResult> {
  if (!/^[A-Z0-9]{8,16}$/.test(orderReference) || !/^[a-z]{3,20}$/.test(gateway)) {
    return { ok: false, code: "validation", message: "That request wasn't valid." };
  }
  const res = await commerceRequest("POST", `/orders/${orderReference}/payments`, { ...(await identity()), body: { gateway } });
  return res ? toPaymentResult(res) : networkError();
}

/**
 * Asks Laravel to check a payment with the gateway. Used by the return page. Whatever the gateway put in the redirect
 * URL is never passed along: only our own payment reference, and Laravel decides from the gateway's server-side answer.
 */
export async function verifyPaymentAction(reference: string): Promise<PaymentResult> {
  if (!isPaymentReference(reference)) return { ok: false, code: "not_found", message: "We couldn't find that payment." };
  const res = await commerceRequest("POST", `/payments/${reference}/verify`, await identity());
  return res ? toPaymentResult(res) : networkError();
}

/** Development simulator only: plays the customer on a fake gateway page. Disabled unless explicitly enabled. */
export async function simulatePaymentAction(reference: string, outcome: "success" | "failed" | "abandoned"): Promise<{ ok: boolean; message?: string }> {
  // The API is the real guard (it refuses the simulator in production); this flag just keeps the UI hidden by default.
  if (process.env.ENABLE_FAKE_PAYMENTS !== "1") {
    return { ok: false, message: "Not available." };
  }
  if (!isPaymentReference(reference) || !["success", "failed", "abandoned"].includes(outcome)) return { ok: false, message: "Invalid request." };
  const res = await commerceRequest("POST", `/dev/payments/${reference}/simulate`, { body: { outcome } });
  return { ok: res?.status === 200, message: res?.status === 200 ? undefined : "The simulator is not enabled on the API." };
}
