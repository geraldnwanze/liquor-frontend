"use client";

import { useActionState, useState, useTransition } from "react";
import { approveReviewAction, deleteReviewAction, rejectReviewAction, removeReviewReplyAction, replyToReviewAction } from "@/app/actions/admin-reviews";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormResult } from "@/components/admin/form-result";
import { IDLE, type FormState } from "@/lib/auth/form-state";

export function ReviewActions({ id, productSlug, status, reply }: { id: string; productSlug: string; status: string; reply: string | null }) {
  const [state, setState] = useState<FormState>(IDLE);
  const [pending, start] = useTransition();
  const [replyState, replyAction, replying] = useActionState(replyToReviewAction.bind(null, id, productSlug), IDLE);
  const go = (fn: () => Promise<FormState>) => start(async () => setState(await fn()));
  return (
    <div className="flex flex-wrap items-start gap-2">
      {status !== "approved" && (
        <button disabled={pending} onClick={() => go(() => approveReviewAction(id, productSlug))} className="h-10 rounded-lg bg-burgundy px-4 text-sm font-semibold text-ivory hover:bg-burgundy-deep disabled:opacity-60">
          Approve
        </button>
      )}
      {status !== "rejected" && (
        <button disabled={pending} onClick={() => go(() => rejectReviewAction(id, productSlug))} className="h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium hover:bg-stone-50 disabled:opacity-60">
          Reject
        </button>
      )}
      <ConfirmButton label="Delete" confirmLabel="Yes, delete" tone="danger" run={() => deleteReviewAction(id, productSlug)} />
      <FormResult state={state} />
      {status === "approved" && (
        <form action={replyAction} className="mt-2 flex w-full flex-col gap-2">
          <label className="text-xs font-medium text-muted" htmlFor={`reply-${id}`}>Public reply from the shop{reply ? " (replaces the current one)" : ""}</label>
          <textarea id={`reply-${id}`} name="reply" required minLength={2} maxLength={1000} rows={2} defaultValue={reply ?? ""} className="w-full rounded-lg border border-stone-300 bg-white p-2 text-sm text-ink" />
          <div className="flex flex-wrap items-center gap-2">
            <button disabled={replying} className="h-10 rounded-lg bg-burgundy px-4 text-sm font-semibold text-ivory hover:bg-burgundy-deep disabled:opacity-60">{replying ? "Posting…" : reply ? "Update reply" : "Post reply"}</button>
            {reply && <button type="button" disabled={pending} onClick={() => go(() => removeReviewReplyAction(id, productSlug))} className="h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium hover:bg-stone-50">Remove reply</button>}
            <FormResult state={replyState} />
          </div>
        </form>
      )}
    </div>
  );
}
