"use server";

import { revalidatePath } from "next/cache";
import { adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { isUuid as isId } from "@/lib/ids";

const bad: FormState = { status: "error", message: "That request wasn't valid." };

type Res = Awaited<ReturnType<typeof adminWrite>>;

function outcome(res: Res, customerId: string, message: string): FormState {
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status >= 200 && res.status < 300) {
    revalidatePath(`/admin/customers/${customerId}`);
    revalidatePath("/admin/customers");
    return { status: "success", message };
  }
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  const err = toError(res);
  return { status: "error", message: err.message, fieldErrors: err.fieldErrors };
}

export async function addCustomerNoteAction(customerId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(customerId)) return bad;
  const body = fd.get("body");
  const text = typeof body === "string" ? body.trim().slice(0, 1000) : "";
  return outcome(await adminWrite("POST", `/customers/${customerId}/notes`, { body: text }), customerId, "Note added. The customer can't see it.");
}

export async function deleteCustomerNoteAction(customerId: string, noteId: string): Promise<FormState> {
  if (!isId(customerId) || !isId(noteId)) return bad;
  return outcome(await adminWrite("DELETE", `/customers/${customerId}/notes/${noteId}`), customerId, "Note deleted.");
}

/** Blocks the account and signs the customer out everywhere. Orders and history are untouched. */
export async function suspendCustomerAction(customerId: string, reason: string): Promise<FormState> {
  if (!isId(customerId)) return bad;
  const cleaned = reason.replace(/\s+/g, " ").trim().slice(0, 300);
  return outcome(await adminWrite("POST", `/customers/${customerId}/suspend`, { reason: cleaned || null }), customerId, "Account suspended. The customer is signed out and can't sign in.");
}

export async function reactivateCustomerAction(customerId: string): Promise<FormState> {
  if (!isId(customerId)) return bad;
  return outcome(await adminWrite("POST", `/customers/${customerId}/reactivate`), customerId, "Account reactivated. The customer can sign in again.");
}
