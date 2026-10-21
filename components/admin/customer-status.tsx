"use client";

import { useState } from "react";
import { reactivateCustomerAction, suspendCustomerAction } from "@/app/actions/admin-customers";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { input } from "@/components/admin/form-styles";

/** Suspend (with an optional reason that is kept on the account) or reactivate a customer. */
export function CustomerStatus({ customerId, active, suspendedAt, reason }: { customerId: string; active: boolean; suspendedAt: string | null; reason: string | null }) {
  const [why, setWhy] = useState("");
  const when = suspendedAt ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(suspendedAt)) : null;

  if (!active) {
    return (
      <div className="space-y-3 text-sm">
        <p><span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-900">Suspended</span>{when && <span className="ml-2 text-xs text-muted">since {when}</span>}</p>
        {reason && <p className="text-muted">Reason: {reason}</p>}
        <p className="text-xs text-muted">This customer is signed out everywhere and can&apos;t sign in. Their orders and details are untouched.</p>
        <ConfirmButton label="Reactivate account" confirmLabel="Yes, reactivate" run={() => reactivateCustomerAction(customerId)} />
      </div>
    );
  }
  return (
    <div className="space-y-3 text-sm">
      <p><span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900">Active</span></p>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted">Reason for suspending (optional, kept on the account)
        <input value={why} onChange={(e) => setWhy(e.target.value)} maxLength={300} className={input} />
      </label>
      <ConfirmButton tone="danger" label="Suspend account" confirmLabel="Yes, suspend and sign out" run={() => suspendCustomerAction(customerId, why)} />
    </div>
  );
}
