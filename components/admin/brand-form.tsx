"use client";

import { useActionState } from "react";
import { saveBrandAction } from "@/app/actions/admin-taxonomy";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary, textarea } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import type { AdminBrand } from "@/lib/api/types";
import { IDLE } from "@/lib/auth/form-state";

export function BrandForm({ brand }: { brand?: AdminBrand }) {
  const [state, action, pending] = useActionState(saveBrandAction.bind(null, brand?.id ?? null), IDLE);
  const err = (k: string) => fieldError(state, k);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" error={err("name")}>{(p) => <input name="name" required maxLength={120} defaultValue={brand?.name} className={input} {...p} />}</Field>
      <Field label="Country" error={err("country")}>{(p) => <input name="country" maxLength={80} defaultValue={brand?.country ?? ""} className={input} {...p} />}</Field>
      <Field label="URL slug" error={err("slug")} hint={brand ? "Changing this changes the brand's web address." : "Leave blank to build it from the name."}>
        {(p) => <input name="slug" maxLength={190} defaultValue={brand?.slug} className={input} {...p} />}
      </Field>
      <Field label="Or a logo address (https)" error={err("logo_url")} hint="Only used when no logo is uploaded above.">{(p) => <input name="logo_url" type="url" maxLength={500} defaultValue={brand?.logo_url ?? ""} placeholder="https://…" className={input} {...p} />}</Field>
      <div className="sm:col-span-2"><Field label="Description" error={err("description")}>{(p) => <textarea name="description" rows={3} maxLength={5000} defaultValue={brand?.description ?? ""} className={textarea} {...p} />}</Field></div>
      <Field label="Search-result title" error={err("seo_title")}>{(p) => <input name="seo_title" maxLength={190} defaultValue={brand?.seo_title ?? ""} className={input} {...p} />}</Field>
      <Field label="Search-result description" error={err("seo_description")}>{(p) => <input name="seo_description" maxLength={320} defaultValue={brand?.seo_description ?? ""} className={input} {...p} />}</Field>
      <div className="flex flex-wrap gap-6 sm:col-span-2">
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={brand?.is_active ?? true} className="size-5" /> Active</label>
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={brand?.is_featured ?? false} className="size-5" /> Featured</label>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button disabled={pending} className={primary}>{pending ? "Saving…" : brand ? "Save changes" : "Create brand"}</button>
        <FormResult state={state} />
      </div>
    </form>
  );
}
