"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminUpload, adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";

const field = (fd: FormData, key: string, max: number): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const TEXT: Record<string, number> = {
  announcement_text: 160, announcement_link: 300, hero_eyebrow: 60, hero_title: 120, hero_title_emphasis: 80, hero_text: 300,
  hero_primary_label: 40, hero_primary_href: 300, hero_secondary_label: 40, hero_secondary_href: 300,
};
const SECTIONS = ["show_best_sellers", "show_new_arrivals", "show_on_sale", "show_how_it_works", "show_promises"];

function done(): void {
  revalidatePath("/admin/home");
  updateTag("settings"); // the shop caches these; expire so the change shows straight away
}

export async function saveHomepageAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const body: Record<string, unknown> = {};
  for (const [key, max] of Object.entries(TEXT)) body[key] = field(fd, key, max) || null;
  for (const key of SECTIONS) body[key] = fd.get(key) === "on";

  const res = await adminWrite("PUT", "/homepage", body);
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  if (res.status !== 200) {
    const err = toError(res);
    return { status: "error", message: Object.values(err.fieldErrors ?? {})[0]?.[0] ?? err.message, fieldErrors: err.fieldErrors };
  }
  done();
  return { status: "success", message: "Saved. The shop shows it straight away." };
}

const TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function uploadHeroImageAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const file = fd.get("file");
  const bad = (message: string): FormState => ({ status: "error", message, fieldErrors: { file: [message] } });
  if (!(file instanceof File) || file.size === 0) return bad("Choose a picture to upload.");
  if (!TYPES.includes(file.type)) return bad("Upload a PNG, JPEG or WebP picture.");
  if (file.size > 5 * 1024 * 1024) return bad("The picture must be 5 MB or smaller.");

  const form = new FormData();
  form.set("file", file, file.name);
  const res = await adminUpload("/homepage/hero-image", form);
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  if (res.status !== 200) {
    const err = toError(res);
    return { status: "error", message: err.fieldErrors?.file?.[0] ?? err.message, fieldErrors: err.fieldErrors };
  }
  done();
  return { status: "success", message: "Picture saved." };
}

export async function removeHeroImageAction(): Promise<FormState> {
  const res = await adminWrite("DELETE", "/homepage/hero-image");
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended." };
  if (res.status !== 204) return { status: "error", message: res.status === 403 ? "Your role isn't allowed to do that." : toError(res).message };
  done();
  return { status: "success", message: "Picture removed." };
}
