"use client";

import { useActionState } from "react";
import { saveCampaignAction } from "@/app/actions/admin-newsletter";
import { FormResult } from "@/components/admin/form-result";
import { IDLE } from "@/lib/auth/form-state";

const input = "w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-ink";

export function CampaignForm({ id = null, subject = "", body = "" }: { id?: string | null; subject?: string; body?: string }) {
  const [state, action, pending] = useActionState(saveCampaignAction.bind(null, id), IDLE);
  const uid = `campaign-${id ?? "new"}`;
  return (
    <form action={action} className="grid gap-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted" htmlFor={`${uid}-subject`}>
        Subject
        <input id={`${uid}-subject`} name="subject" required maxLength={150} defaultValue={subject} className={`${input} h-10`} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted" htmlFor={`${uid}-body`}>
        Message (plain text; leave a blank line between paragraphs)
        <textarea id={`${uid}-body`} name="body" required minLength={10} maxLength={10000} rows={8} defaultValue={body} className={`${input} p-3`} />
      </label>
      <p className="text-xs text-muted">An unsubscribe link is added to every email automatically.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="h-10 rounded-lg bg-burgundy px-5 text-sm font-semibold text-ivory hover:bg-burgundy-deep disabled:opacity-60">{pending ? "Saving…" : id ? "Save changes" : "Save draft"}</button>
        <FormResult state={state} />
      </div>
    </form>
  );
}
