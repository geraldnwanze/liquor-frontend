"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions/account";
import { FormError, PasswordField, SubmitButton } from "@/components/auth/form-parts";
import { IDLE } from "@/lib/auth/form-state";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, IDLE);

  return (
    // Remounting on success clears the typed passwords.
    <form key={state.status === "success" ? "done" : "form"} action={action} className="space-y-4">
      <FormError state={state} />
      {state.status === "success" && (
        <p role="status" className="rounded-lg border-l-4 border-emerald-700 bg-white p-3 text-sm">
          {state.message}
        </p>
      )}
      <PasswordField label="Current password" name="current_password" state={state} autoComplete="current-password" />
      <PasswordField label="New password" name="password" state={state} autoComplete="new-password" hint="At least 10 characters, with letters and numbers." />
      <PasswordField label="Confirm new password" name="password_confirmation" state={state} autoComplete="new-password" />
      <div className="sm:max-w-xs">
        <SubmitButton pending={pending} pendingText="Changing…">
          Change password
        </SubmitButton>
      </div>
    </form>
  );
}
