"use server";

import { revalidatePath, updateTag } from "next/cache";
import { adminUpload, adminWrite } from "@/lib/api/admin";
import { toError } from "@/lib/api/result";
import type { FormState } from "@/lib/auth/form-state";
import { nairaToKobo } from "@/lib/format";
import { isUuid as isId } from "@/lib/ids";

type Res = { status: number; json: unknown } | null;

const text = (fd: FormData, key: string, max = 500): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
};
const nullable = (fd: FormData, key: string, max = 500): string | null => text(fd, key, max) || null;
const flag = (fd: FormData, key: string) => fd.get(key) === "on";
const bad: FormState = { status: "error", message: "That request wasn't valid." };

function fail(res: Res): FormState {
  if (!res) return { status: "error", message: "We couldn't reach the API, or your session has ended. Sign in again if this continues." };
  if (res.status === 403) return { status: "error", message: "Your role isn't allowed to do that." };
  const err = toError(res);
  return { status: "error", message: err.message, fieldErrors: err.fieldErrors };
}

function done(res: Res, productId: string | null, message: string, redirectTo?: string): FormState {
  if (!res || res.status < 200 || res.status >= 300) return fail(res);
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  // The shop caches product pages; expire them now so a staff change shows up straight away.
  updateTag("products");
  return redirectTo ? { status: "success", message, redirectTo } : { status: "success", message };
}

/** Naira typed by staff to integer kobo. "" is null; an unreadable amount is `undefined` (an error). */
function kobo(fd: FormData, key: string): number | null | undefined {
  const raw = text(fd, key, 20);
  if (raw === "") return null;
  return nairaToKobo(raw) ?? undefined;
}

function productBody(fd: FormData, editing: boolean): Record<string, unknown> {
  const abv = text(fd, "abv", 8);
  const flavours = text(fd, "flavor_profile", 400).split(",").map((s) => s.trim().slice(0, 40)).filter(Boolean).slice(0, 12);
  const body: Record<string, unknown> = {
    name: text(fd, "name", 190),
    brand_id: isId(text(fd, "brand_id", 36)) ? text(fd, "brand_id", 36) : null,
    category_id: isId(text(fd, "category_id", 36)) ? text(fd, "category_id", 36) : null,
    short_description: nullable(fd, "short_description"),
    description: nullable(fd, "description", 20000),
    country_of_origin: nullable(fd, "country_of_origin", 80),
    abv: /^\d{1,3}(\.\d{1,2})?$/.test(abv) ? Number(abv) : null,
    flavor_profile: flavours.length ? flavours : null,
    tasting_notes: nullable(fd, "tasting_notes", 5000),
    serving_suggestions: nullable(fd, "serving_suggestions", 5000),
    authenticity_note: nullable(fd, "authenticity_note", 2000),
    is_featured: flag(fd, "is_featured"),
    is_age_restricted: flag(fd, "is_age_restricted"),
    seo_title: nullable(fd, "seo_title", 190),
    seo_description: nullable(fd, "seo_description", 320),
  };
  const slug = text(fd, "slug", 190);
  if (slug) body.slug = slug;
  if (editing) body.status = text(fd, "status", 20);
  return body;
}

export async function createProductAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const res = await adminWrite("POST", "/products", productBody(fd, false));
  const id = (res?.json as { data?: { id?: string } } | null)?.data?.id;
  return res?.status === 201 && id ? done(res, null, "Product created as a draft.", `/admin/products/${id}`) : fail(res);
}

export async function updateProductAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(id)) return bad;
  return done(await adminWrite("PUT", `/products/${id}`, productBody(fd, true)), id, "Product saved.");
}

export async function archiveProductAction(id: string): Promise<FormState> {
  if (!isId(id)) return bad;
  return done(await adminWrite("POST", `/products/${id}/archive`), id, "Product archived.");
}

export async function duplicateProductAction(id: string): Promise<FormState> {
  if (!isId(id)) return bad;
  const res = await adminWrite("POST", `/products/${id}/duplicate`);
  const copy = (res?.json as { data?: { id?: string } } | null)?.data?.id;
  return res?.status === 201 && copy ? done(res, null, "Copied as a draft.", `/admin/products/${copy}`) : fail(res);
}

export async function deleteProductAction(id: string): Promise<FormState> {
  if (!isId(id)) return bad;
  return done(await adminWrite("DELETE", `/products/${id}`), id, "Product deleted.", "/admin/products");
}

function variantBody(fd: FormData, creating: boolean): Record<string, unknown> | FormState {
  const price = kobo(fd, "price");
  const sale = kobo(fd, "sale_price");
  const cost = kobo(fd, "cost_price");
  if (price === undefined || price === null) return { status: "error", message: "Enter the price in naira, for example 15000 or 15000.50.", fieldErrors: { price_kobo: ["A price is required."] } } as FormState;
  if (sale === undefined) return { status: "error", message: "The sale price isn't a valid amount.", fieldErrors: { sale_price_kobo: ["Not a valid amount."] } } as FormState;
  if (cost === undefined) return { status: "error", message: "The cost price isn't a valid amount.", fieldErrors: { cost_price_kobo: ["Not a valid amount."] } } as FormState;
  const body: Record<string, unknown> = {
    sku: text(fd, "sku", 64),
    name: text(fd, "name", 80),
    barcode: nullable(fd, "barcode", 64),
    volume_ml: Number(text(fd, "volume_ml", 7)) || null,
    price_kobo: price,
    sale_price_kobo: sale,
    low_stock_threshold: Number(text(fd, "low_stock_threshold", 6)) || 0,
    is_active: flag(fd, "is_active"),
  };
  if (fd.has("cost_price")) body.cost_price_kobo = cost;
  if (creating) body.initial_stock = Number(text(fd, "initial_stock", 7)) || 0;
  return body;
}

export async function addVariantAction(productId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(productId)) return bad;
  const body = variantBody(fd, true);
  if ("status" in body) return body as FormState;
  return done(await adminWrite("POST", `/products/${productId}/variants`, body), productId, "Variant added.");
}

export async function updateVariantAction(productId: string, variantId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(productId) || !isId(variantId)) return bad;
  const body = variantBody(fd, false);
  if ("status" in body) return body as FormState;
  return done(await adminWrite("PUT", `/variants/${variantId}`, body), productId, "Variant saved.");
}

export async function deleteVariantAction(productId: string, variantId: string): Promise<FormState> {
  if (!isId(productId) || !isId(variantId)) return bad;
  return done(await adminWrite("DELETE", `/variants/${variantId}`), productId, "Variant deleted.");
}

const REASONS = ["received", "correction", "damaged", "returned"];

export async function adjustStockAction(productId: string, variantId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(productId) || !isId(variantId)) return bad;
  const delta = Number(text(fd, "delta", 9));
  const reason = text(fd, "reason", 20);
  if (!Number.isInteger(delta) || delta === 0 || !REASONS.includes(reason)) {
    return { status: "error", message: "Enter a whole number that isn't zero (negative removes stock).", fieldErrors: { delta: ["Enter a whole number that isn't zero."] } };
  }
  return done(await adminWrite("POST", `/variants/${variantId}/stock`, { delta, reason, note: nullable(fd, "note") }), productId, "Stock updated.");
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Uploads one photo. Checked here for a clear message, and again (and re-encoded) by the API. */
export async function uploadImageAction(productId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(productId)) return bad;
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { status: "error", message: "Choose a photo to upload.", fieldErrors: { file: ["Choose a photo to upload."] } };
  if (!UPLOAD_TYPES.includes(file.type)) return { status: "error", message: "Upload a JPEG, PNG or WebP photo.", fieldErrors: { file: ["Upload a JPEG, PNG or WebP photo."] } };
  if (file.size > MAX_UPLOAD_BYTES) return { status: "error", message: "The photo must be 5 MB or smaller.", fieldErrors: { file: ["The photo must be 5 MB or smaller."] } };

  const form = new FormData();
  form.set("file", file, file.name);
  const alt = nullable(fd, "alt", 190);
  if (alt) form.set("alt", alt);
  return done(await adminUpload(`/products/${productId}/images`, form), productId, "Photo uploaded.");
}

export async function makeMainImageAction(productId: string, imageId: string): Promise<FormState> {
  if (!isId(productId) || !isId(imageId)) return bad;
  return done(await adminWrite("POST", `/images/${imageId}/primary`), productId, "Main image changed.");
}

export async function updateImageAction(productId: string, imageId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isId(productId) || !isId(imageId)) return bad;
  return done(await adminWrite("PUT", `/images/${imageId}`, { alt: nullable(fd, "alt", 190) }), productId, "Description saved.");
}

export async function deleteImageAction(productId: string, imageId: string): Promise<FormState> {
  if (!isId(productId) || !isId(imageId)) return bad;
  return done(await adminWrite("DELETE", `/images/${imageId}`), productId, "Image removed.");
}
