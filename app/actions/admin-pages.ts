"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminUpload, adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { isUuid as isId } from "@/lib/ids";

const field = (fd: FormData, key: string, max: number) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};

function done(): void {
  revalidatePath("/admin/pages");
  updateTag("pages");
}

/** Creates a page, or updates one when `id` is given. */
export async function savePageAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const slug = field(fd, "slug", 120);
  const body = {
    title: field(fd, "title", 150),
    ...(slug ? { slug } : {}),
    body: field(fd, "body", 20000),
    meta_description: field(fd, "meta_description", 300) || null,
    status: fd.get("status") === "published" ? "published" : "draft",
    show_in_footer: fd.get("show_in_footer") === "on",
    sort_order: Math.min(9999, Math.max(0, Number(field(fd, "sort_order", 4)) || 0)),
  };
  const res = id === null ? await adminWrite("POST", "/pages", body) : isId(id) ? await adminWrite("PUT", `/pages/${id}`, body) : null;
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  if (res.status !== 200 && res.status !== 201) {
    const err = toError(res);
    return { status: "error", message: err.fieldErrors?.slug?.[0] ?? err.fieldErrors?.body?.[0] ?? err.fieldErrors?.title?.[0] ?? err.message, fieldErrors: err.fieldErrors };
  }
  done();
  if (id !== null) updateTag(`page:${(res.json as { data?: { slug?: string } })?.data?.slug ?? ""}`);
  return { status: "success", message: body.status === "published" ? "Saved and live on the shop." : "Saved as a draft. It is not visible to customers." };
}

export async function deletePageAction(id: string, slug: string): Promise<FormState> {
  if (!isId(id)) return { status: "error", message: "That page wasn't found." };
  const res = await adminWrite("DELETE", `/pages/${id}`);
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended." };
  if (res.status !== 204) return { status: "error", message: res.status === 403 ? "Your role isn't allowed to do that." : toError(res).message };
  done();
  updateTag(`page:${slug}`);
  return { status: "success", message: "Page deleted." };
}

const PICTURE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Uploads a picture for use inside a page and returns its address (to be written into the text as an image). */
export async function uploadPageImageAction(fd: FormData): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a picture to upload." };
  if (!PICTURE_TYPES.includes(file.type)) return { ok: false, message: "Upload a PNG, JPEG or WebP picture." };
  if (file.size > 5 * 1024 * 1024) return { ok: false, message: "The picture must be 5 MB or smaller." };

  const form = new FormData();
  form.set("file", file, file.name);
  const res = await adminUpload("/pages/images", form);
  if (!res) return { ok: false, message: "We couldn't reach the API, or your session has ended." };
  if (res.status === 403) return { ok: false, message: "Your role isn't allowed to do that." };
  const body = res.json as { data?: { url?: string }; errors?: { file?: string[] }; message?: string } | null;
  if (res.status !== 201 || !body?.data?.url) return { ok: false, message: body?.errors?.file?.[0] ?? body?.message ?? "The picture couldn't be uploaded." };
  return { ok: true, url: body.data.url };
}
