"use server";

import { revalidatePath } from "next/cache";
import { commerceRequest, type CommerceResponse } from "@/lib/api/commerce";
import { toError } from "@/lib/api/result";
import { getStaffToken } from "@/lib/auth/session";
import type { FormState } from "@/lib/auth/form-state";
import { nairaToKobo } from "@/lib/format";

const text = (fd: FormData, key: string, max = 500): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const isReference = (v: string) => /^[A-Z0-9]{8,16}$/.test(v);

async function send(method: "POST" | "PUT" | "PATCH", path: string, body: unknown, idempotencyKey?: string): Promise<CommerceResponse | null> {
  const bearer = await getStaffToken();
  if (!bearer) return null;
  return commerceRequest(method, `/admin${path}`, { bearer, body, idempotencyKey });
}

function outcome(res: CommerceResponse | null, reference: string, done: string): FormState {
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status >= 200 && res.status < 300) {
    revalidatePath(`/admin/orders/${reference}`);
    return { status: "success", message: done };
  }
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  const err = toError(res);
  return { status: "error", message: err.message, fieldErrors: err.fieldErrors };
}

const bad: FormState = { status: "error", message: "That request wasn't valid." };

export async function moveFulfilmentAction(reference: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isReference(reference)) return bad;
  const res = await send("PATCH", `/orders/${reference}/fulfilment`, { status: text(fd, "status", 30), note: text(fd, "note") || undefined });
  return outcome(res, reference, "Fulfilment updated.");
}

export async function saveShipmentAction(reference: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isReference(reference)) return bad;
  const body: Record<string, string | null> = {};
  for (const k of ["carrier", "tracking_reference", "carrier_phone", "notes", "estimated_delivery_at"]) body[k] = text(fd, k) || null;
  return outcome(await send("PUT", `/orders/${reference}/shipment`, body), reference, "Shipment saved.");
}

export async function addNoteAction(reference: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isReference(reference)) return bad;
  return outcome(await send("POST", `/orders/${reference}/notes`, { body: text(fd, "body", 1000) }), reference, "Note added. Customers cannot see it.");
}

export async function cancelOrderAction(reference: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isReference(reference)) return bad;
  return outcome(await send("POST", `/orders/${reference}/cancel`, { reason: text(fd, "reason", 300) }), reference, "Order cancelled.");
}

export async function refundAction(orderReference: string, paymentReference: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const key = text(fd, "key", 64);
  if (!isReference(orderReference) || !/^[A-Za-z0-9_-]{8,64}$/.test(paymentReference) || !/^[A-Za-z0-9_-]{16,64}$/.test(key)) return bad;
  const amount = text(fd, "amount", 20);
  const kobo = amount === "" ? undefined : nairaToKobo(amount);
  if (kobo === null || kobo === 0) return { status: "error", message: "Enter the amount in naira, for example 1500 or 1500.50.", fieldErrors: { amount: ["Not a valid amount."] } };
  const res = await send("POST", `/payments/${paymentReference}/refunds`, { amount_kobo: kobo, reason: text(fd, "reason", 255) }, key);
  return outcome(res, orderReference, "Refund requested. It completes when the gateway confirms it.");
}
