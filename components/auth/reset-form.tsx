"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/app/actions/auth";
import { IDLE } from "@/lib/auth/form-state";
import { FormError, PasswordField, SubmitButton } from "./form-parts";
import { useHardRedirect } from "./use-form-redirect";

export function ResetForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, IDLE);
  useHardRedirect(state);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      <FormError state={state} />
      <p className="text-sm text-muted">
        Choose a new password for <strong className="text-ink">{email}</strong>.
      </p>
      <PasswordField label="New password" name="password" state={state} autoComplete="new-password" hint="At least 10 characters, with letters and numbers." />
      <PasswordField label="Confirm new password" name="password_confirmation" state={state} autoComplete="new-password" />
      <SubmitButton pending={pending || state.status === "success"} pendingText="Saving…">
        Reset password
      </SubmitButton>
    </form>
  );
}
