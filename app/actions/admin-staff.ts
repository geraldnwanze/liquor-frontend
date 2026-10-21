"use server";

import { revalidatePath } from "next/cache";
import { adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { isUuid as isId } from "@/lib/ids";

type Res = Awaited<ReturnType<typeof adminWrite>>;

const bad: FormState = { status: "error", message: "That request wasn't valid." };
const text = (fd: FormData, key: string, max: number) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const roles = (fd: FormData) => fd.getAll("roles").filter((v): v is string => typeof v === "string" && /^[a-z0-9-]{1,40}$/.test(v));

function outcome(res: Res, message: string): FormState {
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status >= 200 && res.status < 300) {
    revalidatePath("/admin/staff");
    return { status: "success", message };
  }
  if (res.status === 403) return { status: "error", message: "Only a super administrator can manage staff." };
  const err = toError(res);
  return { status: "error", message: err.message, fieldErrors: err.fieldErrors };
}

export async function inviteStaffAction(_prev: FormState, fd: FormData): Promise<FormState> {
  return outcome(await adminWrite("POST", "/staff", { name: text(fd, "name", 120), email: text(fd, "email", 190), roles: roles(fd) }), "Invitation sent. They set their own password from the email.");
}

export async function updateStaffRolesAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(id)) return bad;
  return outcome(await adminWrite("PATCH", `/staff/${id}`, { roles: roles(fd) }), "Roles saved. They apply straight away.");
}

export async function deactivateStaffAction(id: string): Promise<FormState> {
  if (!isId(id)) return bad;
  return outcome(await adminWrite("POST", `/staff/${id}/deactivate`), "Deactivated and signed out everywhere.");
}

export async function reactivateStaffAction(id: string): Promise<FormState> {
  if (!isId(id)) return bad;
  return outcome(await adminWrite("POST", `/staff/${id}/reactivate`), "Reactivated. Send a new invitation if they need to set a password.");
}

export async function resendInviteAction(id: string): Promise<FormState> {
  if (!isId(id)) return bad;
  return outcome(await adminWrite("POST", `/staff/${id}/resend-invite`), "Invitation sent.");
}
