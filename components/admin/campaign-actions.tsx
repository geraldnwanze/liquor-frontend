"use client";

import { useState, useTransition } from "react";
import { deleteCampaignAction, sendCampaignAction, testCampaignAction } from "@/app/actions/admin-newsletter";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormResult } from "@/components/admin/form-result";
import { IDLE, type FormState } from "@/lib/auth/form-state";

export function CampaignActions({ id, subscribers }: { id: string; subscribers: number }) {
  const [state, setState] = useState<FormState>(IDLE);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-start gap-2">
      <button type="button" disabled={pending} onClick={() => start(async () => setState(await testCampaignAction(id)))} className="h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium hover:bg-stone-50 disabled:opacity-60">
        {pending ? "Sending…" : "Send me a test"}
      </button>
      <ConfirmButton label="Send to everyone" confirmLabel={`Yes, email ${subscribers} ${subscribers === 1 ? "person" : "people"}`} run={() => sendCampaignAction(id, subscribers)} />
      <ConfirmButton label="Delete draft" confirmLabel="Yes, delete" tone="danger" run={() => deleteCampaignAction(id)} />
      <FormResult state={state} />
    </div>
  );
}
