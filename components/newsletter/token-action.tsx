"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/auth/form-state";

/** One button that runs an emailed-link action. A button, so mail scanners that merely open links change nothing. */
export function TokenAction({ token, action, label }: { token: string; action: (token: string) => Promise<FormState>; label: string }) {
  const [result, setResult] = useState<FormState | null>(null);
  const [pending, start] = useTransition();
  if (result) {
    return <p role={result.status === "error" ? "alert" : "status"} className={result.status === "error" ? "text-danger" : "text-accent"}>{result.status === "idle" ? "" : result.message}</p>;
  }
  return (
    <button disabled={pending} onClick={() => start(async () => setResult(await action(token)))} className="min-h-12 rounded-full bg-gold px-8 font-semibold text-midnight transition hover:bg-[#dcb86e] disabled:opacity-60">
      {pending ? "One moment…" : label}
    </button>
  );
}
