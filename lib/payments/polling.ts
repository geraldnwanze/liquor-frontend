import type { PaymentState } from "@/lib/api/types";

/** A payment in one of these states needs no further checking from the return page. */
export function isFinalState(state: PaymentState): boolean {
  return state === "succeeded" || state === "review";
}

/** Failed and abandoned are shown immediately, but the customer may still complete payment on the gateway's page. */
export function shouldKeepPolling(state: PaymentState, elapsedMs: number, maxMs = 90_000): boolean {
  if (isFinalState(state)) return false;
  if (state === "failed" || state === "abandoned") return false;
  return elapsedMs < maxMs;
}

/** Gentle backoff: quick at first (most payments confirm within seconds), then slower. */
export function pollDelayMs(attempt: number): number {
  return Math.min(8_000, 2_500 + attempt * 500);
}

const PAYMENT_REFERENCE = /^LQP[A-Z0-9]{16}$/;
export const isPaymentReference = (value: string): boolean => PAYMENT_REFERENCE.test(value);
