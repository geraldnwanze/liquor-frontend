"use client";

import { useState } from "react";
import { Field, inputClass } from "@/components/ui/field";
import type { FormState } from "@/lib/auth/form-state";

export function FormError({ state }: { state: FormState }) {
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="rounded-lg border-l-4 border-danger bg-white p-3 text-sm text-danger">
      {state.message}
    </p>
  );
}

export function fieldError(state: FormState, name: string): string | undefined {
  return state.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined;
}

export function SubmitButton({ pending, children, pendingText }: { pending: boolean; children: React.ReactNode; pendingText: string }) {
  return (
    <button type="submit" disabled={pending} className="min-h-12 w-full rounded-full bg-gold px-6 font-semibold text-midnight disabled:cursor-not-allowed disabled:opacity-60 transition hover:bg-[#dcb86e]">
      {pending ? pendingText : children}
    </button>
  );
}

/** Password input with a show/hide toggle (a big help on phones). */
export function PasswordField({
  label,
  name,
  state,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  state: FormState;
  autoComplete: "current-password" | "new-password";
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={fieldError(state, name)} hint={hint}>
      {(p) => (
        <div className="relative">
          <input {...p} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required className={`${inputClass} pr-20`} />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            className="absolute right-1 top-1 min-h-10 rounded-md px-3 text-sm font-medium text-accent"
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
      )}
    </Field>
  );
}
