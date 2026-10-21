"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { updateProfileAction } from "@/app/actions/account";
import { FormError, SubmitButton, fieldError } from "@/components/auth/form-parts";
import { Field, inputClass } from "@/components/ui/field";
import type { User } from "@/lib/api/types";
import { IDLE } from "@/lib/auth/form-state";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateProfileAction, IDLE);

  // After a save, fetch the fresh details so the fields keep what was saved (React resets uncontrolled forms).
  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    // Keyed by the saved values, so the form remounts with the new defaults once the refreshed data arrives.
    <form key={`${user.name}|${user.phone}`} action={action} className="space-y-4">
      <FormError state={state} />
      {state.status === "success" && (
        <p role="status" className="rounded-lg border-l-4 border-emerald-700 bg-white p-3 text-sm">
          {state.message}
        </p>
      )}
      <Field label="Full name" error={fieldError(state, "name")}>
        {(p) => <input {...p} name="name" autoComplete="name" required defaultValue={user.name} className={inputClass} />}
      </Field>
      <Field label="Email" hint="To change your email address, please contact support.">
        {(p) => <input {...p} name="email" type="email" value={user.email} readOnly className={`${inputClass} bg-burgundy/5`} />}
      </Field>
      <Field label="Mobile number" error={fieldError(state, "phone")} hint="For delivery updates. e.g. 0803 123 4567">
        {(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={user.phone ?? ""} className={inputClass} />}
      </Field>
      <div className="sm:max-w-xs">
        <SubmitButton pending={pending} pendingText="Saving…">
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}
