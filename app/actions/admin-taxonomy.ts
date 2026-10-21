"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminUpload, adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { isUuid } from "@/lib/ids";

const field = (fd: FormData, key: string, max: number): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const orNull = (v: string) => (v === "" ? null : v);

/** The shop caches categories and product listings; expire them so a change shows on the storefront straight away. */
function refresh(paths: string[]): void {
  for (const path of paths) revalidatePath(path);
  for (const tag of ["categories", "products"]) updateTag(tag);
}

async function save(kind: "categories" | "brands", id: string | null, body: Record<string, unknown>, label: string): Promise<FormState> {
  const res = id === null ? await adminWrite("POST", `/${kind}`, body) : isUuid(id) ? await adminWrite("PUT", `/${kind}/${id}`, body) : null;
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  if (res.status !== 200 && res.status !== 201) {
    const err = toError(res);
    const first = Object.values(err.fieldErrors ?? {})[0]?.[0];
    return { status: "error", message: first ?? err.message, fieldErrors: err.fieldErrors };
  }
  refresh([`/admin/${kind}`, "/admin/products"]);
  return { status: "success", message: id === null ? `${label} created.` : `${label} saved.` };
}

/** Creates a category, or updates one when `id` is given. */
export async function saveCategoryAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const parent = field(fd, "parent_id", 36);
  return save(
    "categories",
    id,
    {
      name: field(fd, "name", 120),
      slug: orNull(field(fd, "slug", 190)),
      parent_id: isUuid(parent) ? parent : null,
      description: orNull(field(fd, "description", 5000)),
      image_url: orNull(field(fd, "image_url", 500)),
      sort_order: Math.min(9999, Math.max(0, Number(field(fd, "sort_order", 4)) || 0)),
      is_active: fd.get("is_active") === "on",
      is_featured: fd.get("is_featured") === "on",
      seo_title: orNull(field(fd, "seo_title", 190)),
      seo_description: orNull(field(fd, "seo_description", 320)),
    },
    "Category",
  );
}

/** Creates a brand, or updates one when `id` is given. */
export async function saveBrandAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  return save(
    "brands",
    id,
    {
      name: field(fd, "name", 120),
      slug: orNull(field(fd, "slug", 190)),
      description: orNull(field(fd, "description", 5000)),
      logo_url: orNull(field(fd, "logo_url", 500)),
      country: orNull(field(fd, "country", 80)),
      is_active: fd.get("is_active") === "on",
      is_featured: fd.get("is_featured") === "on",
      seo_title: orNull(field(fd, "seo_title", 190)),
      seo_description: orNull(field(fd, "seo_description", 320)),
    },
    "Brand",
  );
}

async function remove(kind: "categories" | "brands", id: string, label: string): Promise<FormState> {
  if (!isUuid(id)) return { status: "error", message: "That request wasn't valid." };
  const res = await adminWrite("DELETE", `/${kind}/${id}`);
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  if (res.status !== 204) return { status: "error", message: toError(res).message };
  refresh([`/admin/${kind}`, "/admin/products"]);
  return { status: "success", message: `${label} deleted.` };
}

/** Soft delete: the API refuses while products or sub-categories still use it, and nothing is erased. */
export async function deleteCategoryAction(id: string): Promise<FormState> {
  return remove("categories", id, "Category");
}

export async function deleteBrandAction(id: string): Promise<FormState> {
  return remove("brands", id, "Brand");
}

const PICTURE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

async function uploadPicture(path: string, fd: FormData, label: string): Promise<FormState> {
  const file = fd.get("file");
  const bad = (message: string): FormState => ({ status: "error", message, fieldErrors: { file: [message] } });
  if (!(file instanceof File) || file.size === 0) return bad("Choose a picture to upload.");
  if (!PICTURE_TYPES.includes(file.type)) return bad("Upload a PNG, JPEG or WebP picture.");
  if (file.size > MAX_PICTURE_BYTES) return bad("The picture must be 5 MB or smaller.");

  const form = new FormData();
  form.set("file", file, file.name);
  const res = await adminUpload(path, form);
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  if (res.status < 200 || res.status >= 300) {
    const err = toError(res);
    return { status: "error", message: err.fieldErrors?.file?.[0] ?? err.message, fieldErrors: err.fieldErrors };
  }
  refresh(["/admin/categories", "/admin/brands"]);
  return { status: "success", message: `${label} saved.` };
}

async function removePicture(path: string, label: string): Promise<FormState> {
  const res = await adminWrite("DELETE", path);
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended." };
  if (res.status !== 204) return { status: "error", message: res.status === 403 ? "Your role isn't allowed to do that." : toError(res).message };
  refresh(["/admin/categories", "/admin/brands"]);
  return { status: "success", message: `${label} removed.` };
}

export async function uploadCategoryImageAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return isUuid(id) ? uploadPicture(`/categories/${id}/image`, fd, "Image") : { status: "error", message: "That request wasn't valid." };
}

export async function removeCategoryImageAction(id: string): Promise<FormState> {
  return isUuid(id) ? removePicture(`/categories/${id}/image`, "Image") : { status: "error", message: "That request wasn't valid." };
}

export async function uploadBrandLogoAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  return isUuid(id) ? uploadPicture(`/brands/${id}/logo`, fd, "Logo") : { status: "error", message: "That request wasn't valid." };
}

export async function removeBrandLogoAction(id: string): Promise<FormState> {
  return isUuid(id) ? removePicture(`/brands/${id}/logo`, "Logo") : { status: "error", message: "That request wasn't valid." };
}
