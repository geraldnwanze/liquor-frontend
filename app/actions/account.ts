"use server";

import { revalidatePath } from "next/cache";
import { commerceRequest, type CommerceResponse } from "@/lib/api/commerce";
import { isUuid } from "@/lib/ids";
import { toError } from "@/lib/api/result";
import type { Address, User } from "@/lib/api/types";
import type { FormState } from "@/lib/auth/form-state";
import { getSessionToken } from "@/lib/auth/session";

const text = (fd: FormData, key: string, max = 190): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.slice(0, max) : "";
};

const SIGNED_OUT: FormState = { status: "error", message: "Your session has expired. Please sign in again." };
const NETWORK: FormState = { status: "error", message: "We couldn't reach the shop. Check your connection and try again." };

async function authed(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<CommerceResponse | "signed-out" | null> {
  const bearer = await getSessionToken();
  if (!bearer) return "signed-out";
  const res = await commerceRequest(method, path, { bearer, body });
  return res?.status === 401 ? "signed-out" : res;
}

function result(res: CommerceResponse | "signed-out" | null, okStatus: number[], message: string): FormState {
  if (res === "signed-out") return SIGNED_OUT;
  if (!res) return NETWORK;
  if (okStatus.includes(res.status)) return { status: "success", message };
  const err = toError(res);
  return { status: "error", message: err.message, fieldErrors: err.fieldErrors };
}

export async function updateProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await authed("PATCH", "/me", { name: text(fd, "name", 120), phone: text(fd, "phone", 30) });
  return result(res, [200], "Your details have been saved.");
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await authed("PUT", "/me/password", {
    current_password: text(fd, "current_password", 200),
    password: text(fd, "password", 200),
    password_confirmation: text(fd, "password_confirmation", 200),
  });
  return result(res, [200], "Password changed. Your other devices have been signed out.");
}

function addressBody(fd: FormData) {
  return {
    label: text(fd, "label", 40) || null,
    recipient_name: text(fd, "recipient_name", 120),
    phone: text(fd, "phone", 30),
    state: text(fd, "state", 80),
    city: text(fd, "city", 80),
    address_line: text(fd, "address_line", 255),
    instructions: text(fd, "instructions", 500) || null,
    is_default: fd.get("is_default") === "on",
  };
}

/** Creates a new address, or updates one when `id` is present. */
export async function saveAddressAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = text(fd, "id", 36);
  const res = isUuid(id) ? await authed("PATCH", `/me/addresses/${id}`, addressBody(fd)) : await authed("POST", "/me/addresses", addressBody(fd));
  return result(res, [200, 201], "Address saved.");
}

export async function deleteAddressAction(id: string): Promise<FormState> {
  if (!isUuid(id)) return { status: "error", message: "That address wasn't found." };
  return result(await authed("DELETE", `/me/addresses/${id}`), [204], "Address removed.");
}

export async function setDefaultAddressAction(id: string): Promise<FormState> {
  if (!isUuid(id)) return { status: "error", message: "That address wasn't found." };
  return result(await authed("PATCH", `/me/addresses/${id}`, { is_default: true }), [200], "Default address updated.");
}

/** Contact details and saved addresses to prefill checkout. Null for guests. Personal data: never cached. */
export async function getCheckoutPrefillAction(): Promise<{ user: Pick<User, "name" | "email" | "phone">; addresses: Address[] } | null> {
  const [me, addresses] = await Promise.all([authed("GET", "/me"), authed("GET", "/me/addresses")]);
  if (me === "signed-out" || !me || me.status !== 200) return null;
  const user = (me.json as { data: User }).data;
  const list = addresses && addresses !== "signed-out" && addresses.status === 200 ? (addresses.json as { data: Address[] }).data : [];
  return { user: { name: user.name, email: user.email, phone: user.phone }, addresses: list };
}

/** Asks for the account to be deleted. Needs the password again; staff review it before anything is erased. */
export async function requestAccountDeletionAction(_prev: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("understand") !== "on") return { status: "error", message: "Please tick the box to confirm you understand.", fieldErrors: { understand: ["Please tick the box to confirm you understand."] } };
  const res = await authed("POST", "/me/deletion-request", { password: text(fd, "password", 200), reason: text(fd, "reason", 500) || null });
  if (res === "signed-out") return SIGNED_OUT;
  if (!res) return NETWORK;
  if (res.status === 200 || res.status === 201) {
    revalidatePath("/account");
    return { status: "success", message: "Request sent. We will review it and email you the outcome." };
  }
  const err = toError(res);
  return { status: "error", message: err.fieldErrors?.password?.[0] ?? err.message, fieldErrors: err.fieldErrors };
}

export async function cancelAccountDeletionAction(): Promise<FormState> {
  const res = await authed("DELETE", "/me/deletion-request");
  if (res === "signed-out") return SIGNED_OUT;
  if (!res) return NETWORK;
  if (res.status !== 204) return { status: "error", message: toError(res).message };
  revalidatePath("/account");
  return { status: "success", message: "Request cancelled. Your account stays as it is." };
}
