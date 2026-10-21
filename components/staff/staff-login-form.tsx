"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { staffLoginAction } from "@/app/actions/staff-auth";
import { IDLE } from "@/lib/auth/form-state";

const input = "min-h-12 w-full rounded-lg border border-white/20 bg-white/5 px-3 text-white placeholder:text-white/40 focus:border-gold";

export function StaffLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(staffLoginAction, IDLE);
  const redirectTo = state.status === "success" ? state.redirectTo : undefined;
  useEffect(() => {
    if (redirectTo) window.location.assign(redirectTo);
  }, [redirectTo]);
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.status === "error" && (
        <p role="alert" className="rounded-lg border-l-4 border-rose-400 bg-white/5 p-3 text-sm text-rose-200">
          {state.message}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Work email
        <input name="email" type="email" required autoComplete="username" defaultValue={values.email} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </label>
      <button disabled={pending || state.status === "success"} className="min-h-12 w-full rounded-lg bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e] disabled:opacity-60">
        {pending || state.status === "success" ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-white/70 underline underline-offset-4 hover:text-white">Forgot your password?</Link>
      </p>
    </form>
  );
}
