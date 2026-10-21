"use client";

import { retryFailedCampaignAction } from "@/app/actions/admin-newsletter";
import { ConfirmButton } from "@/components/admin/confirm-button";

export function CampaignRetry({ id, failed }: { id: string; failed: number }) {
  return <ConfirmButton label={`Retry ${failed} failed`} confirmLabel="Yes, retry the failed emails" run={() => retryFailedCampaignAction(id)} />;
}
