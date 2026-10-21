"use client";

import { useActionState } from "react";
import { addCustomerNoteAction, deleteCustomerNoteAction } from "@/app/actions/admin-customers";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { primary, textarea } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";
import type { AdminCustomerNote } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

export function CustomerNotes({ customerId, notes }: { customerId: string; notes: AdminCustomerNote[] }) {
  const [state, action, pending] = useActionState(addCustomerNoteAction.bind(null, customerId), IDLE);
  return (
    <div>
      <form action={action} key={state.status === "success" ? "added" : "open"} className="flex flex-col gap-3">
        <Field label="Add a note" error={fieldError(state, "body")} hint="For your team only. Customers never see notes.">
          {(p) => <textarea name="body" rows={3} required minLength={2} maxLength={1000} className={textarea} {...p} />}
        </Field>
        <button disabled={pending} className={`${primary} self-start`}>{pending ? "Saving…" : "Add note"}</button>
        <FormResult state={state} />
      </form>

      <ul className="mt-5 divide-y divide-stone-100 border-t border-stone-200">
        {notes.map((n) => (
          <li key={n.id} className="py-3 text-sm">
            <p className="whitespace-pre-line">{n.body}</p>
            <p className="mt-1 text-xs text-muted">{n.by ?? "Former staff member"} · {formatDateTime(n.at)}</p>
            <div className="mt-2"><ConfirmButton tone="danger" label="Delete" confirmLabel="Yes, delete note" run={() => deleteCustomerNoteAction(customerId, n.id)} /></div>
          </li>
        ))}
        {notes.length === 0 && <li className="py-4 text-sm text-muted">No notes yet.</li>}
      </ul>
    </div>
  );
}
