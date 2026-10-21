"use server";

import { revalidatePath } from "next/cache";
import { adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { isUuid as isId } from "@/lib/ids";

const bad: FormState = { status: "error", message: "That request wasn't valid." };
const field = (fd: FormData, key: string, max: number) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

type Res = Awaited<ReturnType<typeof adminWrite>>;

function outcome(res: Res, okStatus: number[], message: string): FormState {
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (okStatus.includes(res.status)) {
    revalidatePath("/admin/newsletter/campaigns");
    revalidatePath("/admin/newsletter");
    return { status: "success", message: (res.json as { message?: string } | null)?.message ?? message };
  }
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  const err = toError(res);
  return { status: "error", message: err.fieldErrors?.subject?.[0] ?? err.fieldErrors?.body?.[0] ?? err.message, fieldErrors: err.fieldErrors };
}

/** Creates a draft, or updates one when `id` is given. */
export async function saveCampaignAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const body = { subject: field(fd, "subject", 150), body: field(fd, "body", 10000) };
  if (id === null) return outcome(await adminWrite("POST", "/newsletter/campaigns", body), [201], "Draft saved.");
  return isId(id) ? outcome(await adminWrite("PUT", `/newsletter/campaigns/${id}`, body), [200], "Draft updated.") : bad;
}

export async function deleteCampaignAction(id: string): Promise<FormState> {
  return isId(id) ? outcome(await adminWrite("DELETE", `/newsletter/campaigns/${id}`), [204], "Draft deleted.") : bad;
}

export async function testCampaignAction(id: string): Promise<FormState> {
  return isId(id) ? outcome(await adminWrite("POST", `/newsletter/campaigns/${id}/test`), [200], "Test email sent.") : bad;
}

/** `expected` is the subscriber count the admin was looking at; the API refuses if the list has changed since. */
export async function sendCampaignAction(id: string, expected: number): Promise<FormState> {
  if (!isId(id) || !Number.isInteger(expected) || expected < 0) return bad;
  return outcome(await adminWrite("POST", `/newsletter/campaigns/${id}/send`, { expected_recipients: expected }), [200], "Campaign is on its way to your subscribers.");
}

/** Re-sends only the emails that failed (never the ones that went) to people who are still subscribed. */
export async function retryFailedCampaignAction(id: string): Promise<FormState> {
  return isId(id) ? outcome(await adminWrite("POST", `/newsletter/campaigns/${id}/retry-failed`), [200], "Retrying the failed emails.") : bad;
}
