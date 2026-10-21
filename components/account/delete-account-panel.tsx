"use client";

import { useActionState, useState, useTransition } from "react";
import { cancelAccountDeletionAction, requestAccountDeletionAction } from "@/app/actions/account";
import { FormError, PasswordField, SubmitButton } from "@/components/auth/form-parts";
import { Field, inputClass } from "@/components/ui/field";
import { IDLE, type FormState } from "@/lib/auth/form-state";

/** Ask for the account to be deleted (with the password), or take the request back. Staff review it before anything is erased. */
export function DeleteAccountPanel({ pendingSince }: { pendingSince: string | null }) {
  const [state, action, pending] = useActionState(requestAccountDeletionAction, IDLE);
  const [cancelState, setCancelState] = useState<FormState>(IDLE);
  const [cancelling, startCancel] = useTransition();
  const [open, setOpen] = useState(false);
  const when = pendingSince ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" }).format(new Date(pendingSince)) : null;

  if (pendingSince || state.status === "success") {
    return (
      <div className="space-y-3 text-sm">
        <p role="status" className="rounded-lg border-l-4 border-gold bg-white p-3">
          {when ? `You asked us to delete your account on ${when}.` : "Your request has been sent."} We are reviewing it and will email you when it is done. Until then your account works as normal.
        </p>
        <button type="button" disabled={cancelling} onClick={() => startCancel(async () => setCancelState(await cancelAccountDeletionAction()))} className="min-h-11 rounded-full border border-gold/40 px-5 font-medium text-accent hover:bg-gold/10 disabled:opacity-60">
          {cancelling ? "Cancelling…" : "Cancel my request"}
        </button>
        {cancelState.status === "error" && <p role="alert" className="text-danger">{cancelState.message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">
        You can ask us to delete your account. We will remove your name, email, phone number, saved addresses, wishlist, reviews and newsletter subscription, and you will no longer be able to sign in.
      </p>
      <p className="text-muted">
        We have to keep a record of your past orders, including the name and delivery address on them, for as long as tax and accounting rules require. We use it for nothing else. An order that is still being paid for or delivered must be finished first.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-full border border-danger/60 px-5 font-medium text-danger hover:bg-danger/10">
          I want to delete my account
        </button>
      ) : (
        <form action={action} className="space-y-4 rounded-xl border border-danger/30 p-4">
          <FormError state={state} />
          <PasswordField label="Your password" name="password" state={state} autoComplete="current-password" hint="We ask again to be sure it is you." />
          <Field label="Why are you leaving? (optional)">{(p) => <textarea {...p} name="reason" maxLength={500} rows={2} className={`${inputClass} py-2`} />}</Field>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="understand" className="mt-0.5 size-5 shrink-0 accent-[#d6b36c]" required />
            <span>I understand my account will be deleted and I won&apos;t be able to sign in again.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3 sm:max-w-md">
            <SubmitButton pending={pending} pendingText="Sending…">Send request</SubmitButton>
            <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-3 text-accent underline underline-offset-4">Not now</button>
          </div>
        </form>
      )}
    </div>
  );
}
