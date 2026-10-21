"use client";

import { useActionState } from "react";
import { savePageAction } from "@/app/actions/admin-pages";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { FormResult } from "@/components/admin/form-result";
import { IDLE } from "@/lib/auth/form-state";
import type { CmsPage } from "@/lib/api/types";

const input = "w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-ink";

export function PageForm({ page }: { page?: CmsPage }) {
  const [state, action, pending] = useActionState(savePageAction.bind(null, page?.id ?? null), IDLE);
  const uid = `page-${page?.id ?? "new"}`;
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const label = "flex flex-col gap-1 text-xs font-medium text-muted";
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label} htmlFor={`${uid}-title`}>
          Title
          <input id={`${uid}-title`} name="title" required maxLength={150} defaultValue={page?.title} className={`${input} h-10`} aria-invalid={Boolean(errors.title)} />
        </label>
        <label className={label} htmlFor={`${uid}-slug`}>
          Web address (optional)
          <input id={`${uid}-slug`} name="slug" maxLength={120} defaultValue={page?.slug} placeholder="delivery-and-returns" className={`${input} h-10`} aria-invalid={Boolean(errors.slug)} />
          {errors.slug?.[0] && <span className="text-red-700">{errors.slug[0]}</span>}
        </label>
      </div>
      <div className={label}>
        Content
        <RichTextEditor name="body" label="Page content" defaultValue={page?.body ?? ""} required invalid={Boolean(errors.body)} />
        {errors.body?.[0] && <span className="text-red-700">{errors.body[0]}</span>}
      </div>
      <label className={label} htmlFor={`${uid}-meta`}>
        Search-result description (optional)
        <input id={`${uid}-meta`} name="meta_description" maxLength={300} defaultValue={page?.meta_description ?? ""} className={`${input} h-10`} />
      </label>
      <div className="flex flex-wrap items-end gap-4">
        <label className={label} htmlFor={`${uid}-status`}>
          Status
          <select id={`${uid}-status`} name="status" defaultValue={page?.status ?? "draft"} className={`${input} h-10`}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className={label} htmlFor={`${uid}-order`}>
          Footer order
          <input id={`${uid}-order`} name="sort_order" type="number" min={0} max={9999} defaultValue={page?.sort_order ?? 0} className={`${input} h-10 w-24`} />
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="show_in_footer" defaultChecked={page?.show_in_footer ?? true} className="size-5" /> Link from the footer
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="h-10 rounded-lg bg-burgundy px-5 text-sm font-semibold text-ivory hover:bg-burgundy-deep disabled:opacity-60">{pending ? "Saving…" : page ? "Save changes" : "Create page"}</button>
        <FormResult state={state} />
      </div>
    </form>
  );
}
