import "server-only";
import { redirect } from "next/navigation";
import { getSessionToken } from "@/lib/auth/session";
import { commerceRequest } from "./commerce";
import type { Address, Order, Paginated, User } from "./types";

/** Reads for signed-in pages. Never cached: every response is specific to one customer. */
export async function accountGet<T>(path: string, query?: Record<string, string | number>): Promise<{ status: number; data: T | null }> {
  const bearer = await getSessionToken();
  if (!bearer) return { status: 401, data: null };
  const res = await commerceRequest("GET", path, { bearer, query });
  if (!res) throw new Error("Could not reach the API");
  return { status: res.status, data: res.status === 200 ? (res.json as T) : null };
}

/** The signed-in customer, or null (no cookie, expired or revoked token). */
export async function getCurrentUser(): Promise<User | null> {
  const { data } = await accountGet<{ data: User }>("/me");
  return data?.data ?? null;
}

/** Use at the top of every account page: sends visitors without a valid session to sign in, then back here. */
export async function requireUser(returnTo: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function getMyAddresses(): Promise<Address[]> {
  const { data } = await accountGet<{ data: Address[] }>("/me/addresses");
  return data?.data ?? [];
}

export async function getMyOrders(page: number): Promise<Paginated<Order> | null> {
  const { data } = await accountGet<Paginated<Order>>("/me/orders", { page });
  return data;
}

export async function getMyOrderByReference(reference: string): Promise<Order | null> {
  if (!/^[A-Z0-9]{8,16}$/.test(reference)) return null;
  const { data } = await accountGet<{ data: Order }>(`/me/orders/${reference}`);
  return data?.data ?? null;
}
