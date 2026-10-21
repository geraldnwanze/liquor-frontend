"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { Field, inputClass } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";
import { FormError, PasswordField, SubmitButton, fieldError } from "./form-parts";
import { useHardRedirect } from "./use-form-redirect";

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(registerAction, IDLE);
  useHardRedirect(state);
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormError state={state} />
      <Field label="Full name" error={fieldError(state, "name")}>
        {(p) => <input {...p} name="name" autoComplete="name" required defaultValue={values.name} className={inputClass} />}
      </Field>
      <Field label="Email" error={fieldError(state, "email")}>
        {(p) => <input {...p} name="email" type="email" autoComplete="email" required defaultValue={values.email} className={inputClass} />}
      </Field>
      <Field label="Mobile number (optional)" error={fieldError(state, "phone")} hint="For delivery updates. e.g. 0803 123 4567">
        {(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={values.phone} className={inputClass} />}
      </Field>
      <PasswordField label="Password" name="password" state={state} autoComplete="new-password" hint="At least 10 characters, with letters and numbers." />
      <PasswordField label="Confirm password" name="password_confirmation" state={state} autoComplete="new-password" />
      <SubmitButton pending={pending || state.status === "success"} pendingText="Creating your account…">
        Create account
      </SubmitButton>
    </form>
  );
}
