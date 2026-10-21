"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminUpload, adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { nairaToKobo } from "@/lib/format";
import { isUuid as isId } from "@/lib/ids";

type Res = Awaited<ReturnType<typeof adminWrite>>;

const text = (fd: FormData, key: string, max: number): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const orNull = (v: string) => (v === "" ? null : v);
const int = (fd: FormData, key: string): number | null => {
  const v = text(fd, key, 9);
  return /^\d{1,9}$/.test(v) ? Number(v) : null;
};
const bad: FormState = { status: "error", message: "That request wasn't valid." };

function fail(res: Res): FormState {
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  const err = toError(res);
  return { status: "error", message: err.message, fieldErrors: err.fieldErrors };
}

function ok(res: Res, message: string, tags: string[], paths: string[]): FormState {
  if (!res || res.status < 200 || res.status >= 300) return fail(res);
  for (const path of paths) revalidatePath(path);
  // The shop caches settings and delivery zones; expire them so a change shows on the storefront straight away.
  for (const tag of tags) updateTag(tag);
  return { status: "success", message };
}

export async function saveSettingsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const body = {
    business: {
      name: orNull(text(fd, "name", 120)),
      address: orNull(text(fd, "address", 300)),
      phone: orNull(text(fd, "phone", 40)),
      email: orNull(text(fd, "email", 190)),
      registration_number: orNull(text(fd, "registration_number", 60)),
      receipt_footer: orNull(text(fd, "receipt_footer", 300)),
    },
    commerce: {
      minimum_age: int(fd, "minimum_age"),
      reservation_minutes: int(fd, "reservation_minutes"),
      max_quantity_per_line: int(fd, "max_quantity_per_line"),
      max_units_per_order: int(fd, "max_units_per_order"),
    },
  };
  return ok(await adminWrite("PUT", "/settings", body), "Settings saved.", ["settings"], ["/admin/settings"]);
}

/** Naira typed by staff to kobo: "" is null, unreadable is `undefined`. */
function kobo(fd: FormData, key: string): number | null | undefined {
  const raw = text(fd, key, 20);
  return raw === "" ? null : (nairaToKobo(raw) ?? undefined);
}

function zoneBody(fd: FormData): Record<string, unknown> | FormState {
  const fee = kobo(fd, "fee");
  const threshold = kobo(fd, "free_threshold");
  if (fee === undefined || fee === null) return { status: "error", message: "Enter the delivery fee in naira, e.g. 1500. Use 0 for free.", fieldErrors: { fee_kobo: ["A fee is required."] } };
  if (threshold === undefined) return { status: "error", message: "The free-delivery threshold isn't a valid amount.", fieldErrors: { free_threshold_kobo: ["Not a valid amount."] } };
  return {
    name: text(fd, "name", 120),
    state: text(fd, "state", 80),
    city: orNull(text(fd, "city", 80)),
    fee_kobo: fee,
    free_threshold_kobo: threshold,
    estimated_days_min: int(fd, "estimated_days_min"),
    estimated_days_max: int(fd, "estimated_days_max"),
    notes: orNull(text(fd, "notes", 500)),
    is_active: fd.get("is_active") === "on",
    sort_order: int(fd, "sort_order") ?? 0,
  };
}

const ZONES = ["/admin/settings/delivery"];

export async function createZoneAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const body = zoneBody(fd);
  if ("status" in body) return body as FormState;
  return ok(await adminWrite("POST", "/delivery-zones", body), "Zone added.", ["delivery"], ZONES);
}

export async function updateZoneAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(id)) return bad;
  const body = zoneBody(fd);
  if ("status" in body) return body as FormState;
  return ok(await adminWrite("PUT", `/delivery-zones/${id}`, body), "Zone saved.", ["delivery"], ZONES);
}

export async function deleteZoneAction(id: string): Promise<FormState> {
  if (!isId(id)) return bad;
  return ok(await adminWrite("DELETE", `/delivery-zones/${id}`), "Zone deleted.", ["delivery"], ZONES);
}

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Uploads or replaces the business logo (PNG, JPEG or WebP up to 2 MB; the API re-checks and re-encodes it). */
export async function uploadLogoAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const file = fd.get("file");
  const fieldError = (message: string): FormState => ({ status: "error", message, fieldErrors: { file: [message] } });
  if (!(file instanceof File) || file.size === 0) return fieldError("Choose a logo to upload.");
  if (!LOGO_TYPES.includes(file.type)) return fieldError("Upload a PNG, JPEG or WebP logo.");
  if (file.size > MAX_LOGO_BYTES) return fieldError("The logo must be 2 MB or smaller.");

  const form = new FormData();
  form.set("file", file, file.name);
  const res = await adminUpload("/settings/logo", form);
  if (!res) return fail(null);
  if (res.status < 200 || res.status >= 300) return fail({ ...res, headers: new Headers() });
  return ok({ ...res, headers: new Headers() }, "Logo saved. It now shows on the shop and on new receipts.", ["settings"], ["/admin/settings"]);
}

export async function removeLogoAction(): Promise<FormState> {
  return ok(await adminWrite("DELETE", "/settings/logo"), "Logo removed.", ["settings"], ["/admin/settings"]);
}
