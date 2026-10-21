"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Field, inputClass } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";
import { FormError, SubmitButton, fieldError } from "./form-parts";

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, IDLE);
  const values = state.status === "error" ? (state.values ?? {}) : {};

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-lg border-l-4 border-gold bg-white p-4 text-sm">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormError state={state} />
      <Field label="Email" error={fieldError(state, "email")}>
        {(p) => <input {...p} name="email" type="email" autoComplete="email" required defaultValue={values.email} className={inputClass} />}
      </Field>
      <SubmitButton pending={pending} pendingText="Sending…">
        Email me a reset link
      </SubmitButton>
    </form>
  );
}
