import "server-only";
import { baseUrl } from "./client";
import { applyQuery, type Query } from "./query";
import type { RawResponse } from "./result";

export interface CommerceResponse extends RawResponse {
  headers: Headers;
}

/**
 * Calls the Laravel API for cart/checkout/orders. Never cached. Returns the status and parsed body even for 4xx so
 * callers can surface the API's machine-readable `code`; returns null only when the API cannot be reached.
 */
export async function commerceRequest(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  opts: { token?: string | null; bearer?: string | null; forwardedFor?: string | null; query?: Query; body?: unknown; idempotencyKey?: string } = {},
): Promise<CommerceResponse | null> {
  const url = applyQuery(new URL(`${baseUrl()}${path}`), opts.query ?? {});
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.token) headers["X-Cart-Token"] = opts.token;
  if (opts.bearer) headers.Authorization = `Bearer ${opts.bearer}`;
  // Lets Laravel rate-limit the real client rather than this server (it only trusts this when TRUSTED_PROXIES is set).
  if (opts.forwardedFor) headers["X-Forwarded-For"] = opts.forwardedFor;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const json: unknown = await res.json().catch(() => null);
    return { status: res.status, json, headers: res.headers };
  } catch {
    return null;
  }
}
