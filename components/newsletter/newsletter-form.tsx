"use client";

import { useActionState } from "react";
import { subscribeNewsletterAction } from "@/app/actions/engagement";
import { IDLE } from "@/lib/auth/form-state";

/** Double opt-in: signing up only sends a confirmation email. Consent has to be ticked, never pre-ticked. */
export function NewsletterForm({ id = "newsletter" }: { id?: string }) {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, IDLE);

  if (state.status === "success") {
    return <p role="status" className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm">{state.message}</p>;
  }
  return (
    <form action={action} className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`${id}-email`} className="sr-only">Email address</label>
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? `${id}-error` : undefined}
          className="min-h-12 flex-1 rounded-full border border-gold/30 bg-white/5 px-5 text-ink placeholder:text-muted focus:border-gold"
        />
        <button disabled={pending} className="min-h-12 rounded-full bg-gold px-7 font-semibold text-midnight transition hover:bg-[#dcb86e] disabled:opacity-60">
          {pending ? "Sending…" : "Subscribe"}
        </button>
      </div>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-[#d6b36c]" />
        <span>I agree to receive news and offers by email and understand I can unsubscribe at any time.</span>
      </label>
      {state.status === "error" && <p id={`${id}-error`} role="alert" className="text-sm text-danger">{state.message}</p>}
    </form>
  );
}
