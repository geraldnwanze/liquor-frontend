"use server";

import { revalidatePath } from "next/cache";
import { adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { isUuid } from "@/lib/ids";

const bad: FormState = { status: "error", message: "That request wasn't valid." };

function outcome(res: Awaited<ReturnType<typeof adminWrite>>, message: string): FormState {
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  if (res.status !== 200) return { status: "error", message: toError(res).message };
  revalidatePath("/admin/deletion-requests");
  revalidatePath("/admin/customers");
  return { status: "success", message };
}

/** Erases the customer's personal data. Orders are kept. The API refuses while they have an order still in motion. */
export async function completeDeletionAction(id: string): Promise<FormState> {
  return isUuid(id) ? outcome(await adminWrite("POST", `/deletion-requests/${id}/complete`), "Done. The customer's details were erased and they have been emailed.") : bad;
}

export async function declineDeletionAction(id: string, note: string): Promise<FormState> {
  const text = note.replace(/\s+/g, " ").trim().slice(0, 300);
  if (!isUuid(id)) return bad;
  if (text.length < 3) return { status: "error", message: "Tell the customer why (at least a few words)." };
  return outcome(await adminWrite("POST", `/deletion-requests/${id}/reject`, { note: text }), "Declined. The customer has been emailed your reason.");
}
