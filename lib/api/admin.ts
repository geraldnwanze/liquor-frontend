import "server-only";
import { notFound, redirect } from "next/navigation";
import { commerceRequest } from "@/lib/api/commerce";
import { baseUrl } from "@/lib/api/client";
import { getStaffToken } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import type { User } from "@/lib/api/types";

/** The signed-in staff member (verified with the API using the staff session), or null. */
export async function getStaffUser(): Promise<User | null> {
  const bearer = await getStaffToken();
  if (!bearer) return null;
  const res = await commerceRequest("GET", "/me", { bearer });
  if (!res) throw new Error("Could not reach the API");
  return res.status === 200 ? (res.json as { data: User }).data : null;
}

/**
 * Top of every admin page. Visitors without a session go to sign in; signed-in customers get a plain 404 so the area
 * is not advertised. What a staff member may *do* is checked by the API on every call; `can()` only hides buttons.
 */
export async function requireStaff(returnTo: string, ...anyOf: string[]): Promise<User> {
  const user = await getStaffUser();
  if (!user) redirect(`/staff/login?next=${encodeURIComponent(returnTo)}`);
  const needed = anyOf.length > 0 ? anyOf : ["orders.view", "orders.manage"];
  if (!user.is_staff || !needed.some((permission) => can(user, permission))) notFound();
  return user;
}

/** Staff writes (Server Actions only). Returns null when there is no session or the API cannot be reached. */
export async function adminWrite(method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, idempotencyKey?: string) {
  const bearer = await getStaffToken();
  if (!bearer) return null;
  return commerceRequest(method, `/admin${path}`, { bearer, body, idempotencyKey });
}

/** Staff file uploads (Server Actions only): sends multipart form data, which `adminWrite` (JSON) cannot. */
export async function adminUpload(path: string, form: FormData): Promise<{ status: number; json: unknown } | null> {
  const bearer = await getStaffToken();
  if (!bearer) return null;
  try {
    const res = await fetch(`${baseUrl()}/admin${path}`, {
      method: "POST",
      // No Content-Type: fetch sets the multipart boundary itself.
      headers: { Accept: "application/json", Authorization: `Bearer ${bearer}` },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  } catch {
    return null;
  }
}

/** Staff reads. Never cached. Returns the status so pages can 404 on a missing record. */
export async function adminGet<T>(path: string, query?: Record<string, string | number>): Promise<{ status: number; data: T | null }> {
  const bearer = await getStaffToken();
  if (!bearer) return { status: 401, data: null };
  const res = await commerceRequest("GET", `/admin${path}`, { bearer, query });
  if (!res) throw new Error("Could not reach the API");
  return { status: res.status, data: res.status === 200 ? (res.json as T) : null };
}
