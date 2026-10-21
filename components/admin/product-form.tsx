"use client";

import { useActionState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/admin-catalog";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary, textarea } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";
import type { AdminProduct } from "@/lib/api/types";

type Option = { id: string; name: string; parent_id?: string | null };

const STATUSES: [string, string][] = [["draft", "Draft (hidden from the shop)"], ["active", "Active (visible and buyable)"], ["archived", "Archived"], ["discontinued", "Discontinued"]];

export function ProductForm({ product, brands, categories }: { product?: AdminProduct; brands: Option[]; categories: Option[] }) {
  const [state, action, pending] = useActionState(product ? updateProductAction.bind(null, product.id) : createProductAction, IDLE);
  const err = (k: string) => fieldError(state, k);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Field label="Name" error={err("name")}>{(p) => <input name="name" required maxLength={190} defaultValue={product?.name} className={input} {...p} />}</Field></div>
      <Field label="Brand" error={err("brand_id")}>
        {(p) => <select name="brand_id" defaultValue={product?.brand?.id ?? ""} className={input} {...p}><option value="">No brand</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
      </Field>
      <Field label="Category" error={err("category_id")}>
        {(p) => <select name="category_id" defaultValue={product?.category?.id ?? ""} className={input} {...p}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "— " : ""}{c.name}</option>)}</select>}
      </Field>
      {product && (
        <Field label="Status" error={err("status")} hint="Publishing needs at least one active variant.">
          {(p) => <select name="status" defaultValue={product.status} className={input} {...p}>{STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
        </Field>
      )}
      <Field label="URL slug" error={err("slug")} hint={product ? "Changing this changes the product's web address." : "Leave blank to build it from the name."}>
        {(p) => <input name="slug" maxLength={190} defaultValue={product?.slug} className={input} {...p} />}
      </Field>
      <div className="sm:col-span-2"><Field label="Short description" error={err("short_description")}>{(p) => <input name="short_description" maxLength={500} defaultValue={product?.short_description ?? ""} className={input} {...p} />}</Field></div>
      <div className="sm:col-span-2"><Field label="Description" error={err("description")}>{(p) => <textarea name="description" rows={5} maxLength={20000} defaultValue={product?.description ?? ""} className={textarea} {...p} />}</Field></div>
      <Field label="Country of origin" error={err("country_of_origin")}>{(p) => <input name="country_of_origin" maxLength={80} defaultValue={product?.country_of_origin ?? ""} className={input} {...p} />}</Field>
      <Field label="Alcohol by volume (%)" error={err("abv")}>{(p) => <input name="abv" inputMode="decimal" defaultValue={product?.abv ?? ""} className={input} {...p} />}</Field>
      <div className="sm:col-span-2"><Field label="Flavour profile" error={err("flavor_profile")} hint="Separate with commas, e.g. smoky, vanilla, oak.">{(p) => <input name="flavor_profile" defaultValue={product?.flavor_profile?.join(", ") ?? ""} className={input} {...p} />}</Field></div>
      <div className="sm:col-span-2"><Field label="Tasting notes" error={err("tasting_notes")}>{(p) => <textarea name="tasting_notes" rows={3} maxLength={5000} defaultValue={product?.tasting_notes ?? ""} className={textarea} {...p} />}</Field></div>
      <div className="sm:col-span-2"><Field label="Serving suggestions" error={err("serving_suggestions")}>{(p) => <textarea name="serving_suggestions" rows={3} maxLength={5000} defaultValue={product?.serving_suggestions ?? ""} className={textarea} {...p} />}</Field></div>
      <div className="sm:col-span-2"><Field label="Authenticity note" error={err("authenticity_note")} hint="Only state what you can prove, e.g. the supplier or importer.">{(p) => <textarea name="authenticity_note" rows={2} maxLength={2000} defaultValue={product?.authenticity_note ?? ""} className={textarea} {...p} />}</Field></div>
      <Field label="SEO title" error={err("seo_title")}>{(p) => <input name="seo_title" maxLength={190} defaultValue={product?.seo_title ?? ""} className={input} {...p} />}</Field>
      <Field label="SEO description" error={err("seo_description")}>{(p) => <input name="seo_description" maxLength={320} defaultValue={product?.seo_description ?? ""} className={input} {...p} />}</Field>
      <fieldset className="flex flex-wrap gap-6 sm:col-span-2">
        <legend className="sr-only">Options</legend>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} className="size-4" /> Featured</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_age_restricted" defaultChecked={product?.is_age_restricted ?? true} className="size-4" /> Age restricted (alcohol)</label>
      </fieldset>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <button disabled={pending} className={`${primary} self-start`}>{pending ? "Saving…" : product ? "Save product" : "Create product"}</button>
        <FormResult state={state} />
      </div>
    </form>
  );
}
