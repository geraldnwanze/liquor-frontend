"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { simulatePaymentAction } from "@/app/actions/payments";

/** Stands in for a gateway's hosted page while developing locally. Not a real payment. */
export function DevPayPanel({ reference }: { reference: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(outcome: "success" | "failed" | "abandoned") {
    setBusy(true);
    setError(null);
    const result = await simulatePaymentAction(reference, outcome);
    if (!result.ok) {
      setBusy(false);
      setError(result.message ?? "Something went wrong.");
      return;
    }
    // Like a real gateway: send the customer back to the return URL (with a decoy status the page must ignore).
    router.push(`/payment/return/${reference}?status=${outcome === "success" ? "successful" : "cancelled"}`);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <p className="rounded-lg bg-gold/25 p-3 text-sm font-medium">Development simulator: no money moves.</p>
      <h1 className="mt-4 text-2xl font-semibold text-accent">Test payment page</h1>
      <p className="mt-1 text-sm text-muted">Reference {reference}</p>
      <div className="mt-6 grid gap-3">
        <button disabled={busy} onClick={() => choose("success")} className="min-h-12 rounded-full bg-emerald-700 px-6 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50">Pay successfully</button>
        <button disabled={busy} onClick={() => choose("failed")} className="min-h-12 rounded-full bg-rose-900 px-6 font-semibold text-white transition hover:bg-rose-800 disabled:opacity-50">Decline the card</button>
        <button disabled={busy} onClick={() => choose("abandoned")} className="min-h-12 rounded-full border border-ink/40 px-6 font-semibold text-ink disabled:opacity-50">Close without paying</button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
    </div>
  );
}
