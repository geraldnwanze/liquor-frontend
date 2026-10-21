"use client";

import { useState } from "react";
import { completeDeletionAction, declineDeletionAction } from "@/app/actions/admin-deletions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { input } from "@/components/admin/form-styles";

export function DeletionActions({ id, hasOpenOrders }: { id: string; hasOpenOrders: boolean }) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      {hasOpenOrders ? (
        <p className="text-sm text-amber-900">This customer has an order that is unpaid or not yet delivered. Finish it before erasing, or decline for now.</p>
      ) : (
        <ConfirmButton tone="danger" label="Erase this customer" confirmLabel="Yes, erase their details" run={() => completeDeletionAction(id)} />
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-60 flex-1 flex-col gap-1 text-xs font-medium text-muted">Or decline, telling the customer why
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. We are investigating a dispute" className={input} />
        </label>
        <ConfirmButton label="Decline" confirmLabel="Yes, decline and email them" run={() => declineDeletionAction(id, note)} />
      </div>
    </div>
  );
}
