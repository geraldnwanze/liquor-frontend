"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { FormState } from "@/lib/auth/form-state";

/** Shows the outcome of a Server Action, and follows its redirect (e.g. to a newly created product). */
export function FormResult({ state }: { state: FormState }) {
  const router = useRouter();
  const target = state.status === "success" ? state.redirectTo : undefined;
  useEffect(() => {
    if (target) router.push(target);
  }, [target, router]);

  if (state.status === "idle") return null;
  return (
    <p role={state.status === "error" ? "alert" : "status"} className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-800"}`}>
      {state.message}
    </p>
  );
}

export const fieldError = (state: FormState, key: string) => (state.status === "error" ? state.fieldErrors?.[key]?.[0] : undefined);
