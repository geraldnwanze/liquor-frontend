import "server-only";
import { applyQuery, type Query } from "./query";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function baseUrl(): string {
  const url = process.env.API_BASE_URL ?? (process.env.NODE_ENV === "production" ? undefined : "http://localhost:8000/api/v1");
  if (!url) throw new Error("API_BASE_URL is not set. Point it at the Laravel API, e.g. https://api.example.com/api/v1");
  return url.replace(/\/$/, "");
}

/**
 * GET from the Laravel public API (server-side only, so API location and any future secrets never reach the browser).
 * Returns null for 404 so callers can call notFound(); throws for everything else so failures are never cached.
 */
export async function apiGet<T>(path: string, query: Query = {}): Promise<T | null> {
  const url = applyQuery(new URL(`${baseUrl()}${path}`), query);

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  } catch (cause) {
    throw new ApiError(0, `Could not reach the API at ${url.origin} (${cause instanceof Error ? cause.message : "network error"})`);
  }

  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError(res.status, `API ${res.status} for ${url.pathname}`);
  return (await res.json()) as T;
}
