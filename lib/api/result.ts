import type { Cart, Order, PaymentInfo } from "./types";

/** Result of a server action. Plain data only, so it can cross the server/client boundary. */
export type ActionError = {
  ok: false;
  /** Machine-readable: the Laravel `code`, `validation`, `network` or `error`. */
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  details?: Record<string, unknown>;
};
export type CartResult = { ok: true; cart: Cart } | ActionError;
export type OrderResult = { ok: true; order: Order; replayed: boolean } | ActionError;

export type PaymentResult = { ok: true; payment: PaymentInfo } | ActionError;

export interface RawResponse {
  status: number;
  json: unknown;
}

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

export function toError(res: RawResponse): ActionError {
  const body = obj(res.json);
  const fieldErrors = body.errors && typeof body.errors === "object" ? (body.errors as Record<string, string[]>) : undefined;
  return {
    ok: false,
    code: typeof body.code === "string" ? body.code : res.status === 422 ? "validation" : res.status === 429 ? "rate_limited" : "error",
    message: typeof body.message === "string" ? body.message : "Something went wrong. Please try again.",
    fieldErrors,
    details: body.details && typeof body.details === "object" ? (body.details as Record<string, unknown>) : undefined,
  };
}

export function networkError(): ActionError {
  return { ok: false, code: "network", message: "We couldn't reach the shop. Check your connection and try again." };
}

export function toCartResult(res: RawResponse): CartResult {
  if (res.status >= 200 && res.status < 300) return { ok: true, cart: obj(res.json).data as Cart };
  return toError(res);
}

export function toOrderResult(res: RawResponse): OrderResult {
  if (res.status >= 200 && res.status < 300) return { ok: true, order: obj(res.json).data as Order, replayed: res.status === 200 };
  return toError(res);
}

export function toPaymentResult(res: RawResponse): PaymentResult {
  if (res.status >= 200 && res.status < 300) return { ok: true, payment: obj(res.json).data as PaymentInfo };
  return toError(res);
}
