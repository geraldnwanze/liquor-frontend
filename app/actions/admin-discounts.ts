"use server";

import { revalidatePath } from "next/cache";
import { adminGet, adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { lagosInputToIso } from "@/lib/admin/discount-format";
import { nairaToKobo } from "@/lib/format";
import { isUuid as isId } from "@/lib/ids";

type Res = Awaited<ReturnType<typeof adminWrite>>;

const text = (fd: FormData, key: string, max = 200): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const whole = (fd: FormData, key: string): number | null => {
  const v = text(fd, key, 9);
  return /^\d{1,9}$/.test(v) && Number(v) > 0 ? Number(v) : null;
};
const ids = (fd: FormData, key: string): string[] => fd.getAll(key).filter(isId).slice(0, 200);
const bad: FormState = { status: "error", message: "That request wasn't valid." };

function fail(res: Res): FormState {
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  const err = toError(res);
  return { status: "error", message: err.message, fieldErrors: err.fieldErrors };
}

function done(res: Res, message: string, redirectTo?: string, id?: string): FormState {
  if (!res || res.status < 200 || res.status >= 300) return fail(res);
  revalidatePath("/admin/discounts");
  if (id) revalidatePath(`/admin/discounts/${id}`);
  return redirectTo ? { status: "success", message, redirectTo } : { status: "success", message };
}

/** Naira typed by staff to kobo: "" is null, unreadable is `undefined`. */
function kobo(fd: FormData, key: string): number | null | undefined {
  const raw = text(fd, key, 20);
  return raw === "" ? null : (nairaToKobo(raw) ?? undefined);
}

function body(fd: FormData): Record<string, unknown> | FormState {
  const type = text(fd, "type", 20);
  const scope = text(fd, "scope", 20);
  const amount = kobo(fd, "amount");
  const cap = kobo(fd, "max_discount");
  const min = kobo(fd, "min_order");
  const money: [string, number | null | undefined, string][] = [["amount_kobo", amount, "amount"], ["max_discount_kobo", cap, "cap"], ["min_order_kobo", min, "minimum order"]];
  for (const [field, value, label] of money) {
    if (value === undefined) return { status: "error", message: `The ${label} isn't a valid amount in naira.`, fieldErrors: { [field]: ["Enter an amount like 1500 or 1500.50."] } };
  }

  const out: Record<string, unknown> = {
    code: text(fd, "code", 32),
    name: text(fd, "name", 120),
    type,
    scope,
    min_order_kobo: min,
    starts_at: lagosInputToIso(text(fd, "starts_at", 20)),
    ends_at: lagosInputToIso(text(fd, "ends_at", 20)),
    usage_limit: whole(fd, "usage_limit"),
    per_customer_limit: whole(fd, "per_customer_limit"),
    is_active: fd.get("is_active") === "on",
  };
  if (type === "percentage") {
    out.percent = whole(fd, "percent");
    out.max_discount_kobo = cap;
  }
  if (type === "fixed") out.amount_kobo = amount;
  if (scope === "products") out.product_ids = ids(fd, "product_ids");
  if (scope === "categories") out.category_ids = ids(fd, "category_ids");
  return out;
}

export async function createDiscountAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const payload = body(fd);
  if ("status" in payload) return payload as FormState;
  const res = await adminWrite("POST", "/discounts", payload);
  const id = (res?.json as { data?: { id?: string } } | null)?.data?.id;
  return res?.status === 201 && id ? done(res, "Discount created.", `/admin/discounts/${id}`) : fail(res);
}

export async function updateDiscountAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(id)) return bad;
  const payload = body(fd);
  if ("status" in payload) return payload as FormState;
  return done(await adminWrite("PUT", `/discounts/${id}`, payload), "Discount saved.", undefined, id);
}

export async function deleteDiscountAction(id: string): Promise<FormState> {
  if (!isId(id)) return bad;
  return done(await adminWrite("DELETE", `/discounts/${id}`), "Discount deleted.", "/admin/discounts");
}

/** Type-ahead for the product picker. Uses the promotions-only endpoint, so it works without catalogue access. */
export async function searchProductsAction(query: string): Promise<{ id: string; name: string }[]> {
  const q = typeof query === "string" ? query.trim().slice(0, 100) : "";
  if (q.length < 2) return [];
  const { data } = await adminGet<{ data: { products: { id: string; name: string }[] } }>("/discounts/targets", { q });
  return data?.data.products ?? [];
}
