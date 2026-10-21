"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { loginAction } from "@/app/actions/auth";
import { Field, inputClass } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";
import { announceSessionChange } from "@/lib/auth/session-events";
import { FormError, PasswordField, SubmitButton, fieldError } from "./form-parts";
import { useHardRedirect } from "./use-form-redirect";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, IDLE);
  useHardRedirect(state);

  // The server only shows this page to someone with no *valid* session. If the browser still carries the "signed in"
  // flag (e.g. the session was revoked by a password reset), clear it so the header stops claiming otherwise.
  useEffect(() => {
    if (document.cookie.split("; ").includes("lq_has_session=1")) {
      document.cookie = "lq_has_session=; Max-Age=0; path=/";
      announceSessionChange();
    }
  }, []);
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormError state={state} />
      <Field label="Email" error={fieldError(state, "email")}>
        {(p) => <input {...p} name="email" type="email" autoComplete="username" required defaultValue={values.email} className={inputClass} />}
      </Field>
      <PasswordField label="Password" name="password" state={state} autoComplete="current-password" />
      <SubmitButton pending={pending || state.status === "success"} pendingText="Signing in…">
        Sign in
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-accent underline underline-offset-4">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
