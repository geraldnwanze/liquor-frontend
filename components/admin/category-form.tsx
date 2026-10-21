"use client";

import { useActionState } from "react";
import { saveCategoryAction } from "@/app/actions/admin-taxonomy";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary, textarea } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import type { AdminCategory } from "@/lib/api/types";
import { IDLE } from "@/lib/auth/form-state";

export function CategoryForm({ category, all }: { category?: AdminCategory; all: AdminCategory[] }) {
  const [state, action, pending] = useActionState(saveCategoryAction.bind(null, category?.id ?? null), IDLE);
  const err = (k: string) => fieldError(state, k);
  // A category can sit under any other category (the API refuses loops); show the top level first.
  const parents = all.filter((c) => c.id !== category?.id).sort((a, b) => Number(Boolean(a.parent_id)) - Number(Boolean(b.parent_id)) || a.name.localeCompare(b.name));

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" error={err("name")}>{(p) => <input name="name" required maxLength={120} defaultValue={category?.name} className={input} {...p} />}</Field>
      <Field label="Sits under" error={err("parent_id")} hint="Leave empty for a top-level category.">
        {(p) => <select name="parent_id" defaultValue={category?.parent_id ?? ""} className={input} {...p}><option value="">Top level</option>{parents.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "— " : ""}{c.name}</option>)}</select>}
      </Field>
      <Field label="URL slug" error={err("slug")} hint={category ? "Changing this changes the category's web address." : "Leave blank to build it from the name."}>
        {(p) => <input name="slug" maxLength={190} defaultValue={category?.slug} className={input} {...p} />}
      </Field>
      <Field label="Order in menus" error={err("sort_order")} hint="Lower numbers come first.">
        {(p) => <input name="sort_order" type="number" min={0} max={9999} defaultValue={category?.sort_order ?? 0} className={input} {...p} />}
      </Field>
      <div className="sm:col-span-2"><Field label="Description" error={err("description")}>{(p) => <textarea name="description" rows={3} maxLength={5000} defaultValue={category?.description ?? ""} className={textarea} {...p} />}</Field></div>
      <div className="sm:col-span-2"><Field label="Or an image address (https)" error={err("image_url")} hint="Only used when no picture is uploaded above.">{(p) => <input name="image_url" type="url" maxLength={500} defaultValue={category?.image_url ?? ""} placeholder="https://…" className={input} {...p} />}</Field></div>
      <Field label="Search-result title" error={err("seo_title")}>{(p) => <input name="seo_title" maxLength={190} defaultValue={category?.seo_title ?? ""} className={input} {...p} />}</Field>
      <Field label="Search-result description" error={err("seo_description")}>{(p) => <input name="seo_description" maxLength={320} defaultValue={category?.seo_description ?? ""} className={input} {...p} />}</Field>
      <div className="flex flex-wrap gap-6 sm:col-span-2">
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} className="size-5" /> Visible in the shop</label>
        <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={category?.is_featured ?? false} className="size-5" /> Featured on the home page</label>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button disabled={pending} className={primary}>{pending ? "Saving…" : category ? "Save changes" : "Create category"}</button>
        <FormResult state={state} />
      </div>
    </form>
  );
}
