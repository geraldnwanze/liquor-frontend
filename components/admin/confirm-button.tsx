"use client";

import { useState, useTransition } from "react";
import { FormResult } from "@/components/admin/form-result";
import { IDLE, type FormState } from "@/lib/auth/form-state";

/** Two-step button for actions that are hard to undo. `run` is a Server Action call. */
export function ConfirmButton({ label, confirmLabel, run, tone = "neutral" }: { label: string; confirmLabel: string; run: () => Promise<FormState>; tone?: "neutral" | "danger" }) {
  const [armed, setArmed] = useState(false);
  const [state, setState] = useState<FormState>(IDLE);
  const [pending, start] = useTransition();
  const first = tone === "danger" ? "border-red-300 text-red-800 hover:bg-red-50" : "border-stone-300 hover:bg-stone-50";

  return (
    <div className="flex flex-col items-start gap-2">
      {armed ? (
        <div role="group" aria-label="Confirm" className="flex flex-wrap items-center gap-2 rounded-lg bg-stone-100 p-3">
          <button type="button" disabled={pending} onClick={() => start(async () => { setState(await run()); setArmed(false); })} className="h-10 rounded-lg bg-burgundy px-4 text-sm font-semibold text-ivory disabled:opacity-60">{pending ? "Working…" : confirmLabel}</button>
          <button type="button" disabled={pending} onClick={() => setArmed(false)} className="h-10 rounded-lg px-4 text-sm font-medium">Back</button>
        </div>
      ) : (
        <button type="button" onClick={() => { setState(IDLE); setArmed(true); }} className={`h-10 rounded-lg border bg-white px-4 text-sm font-medium ${first}`}>{label}</button>
      )}
      <FormResult state={state} />
    </div>
  );
}
