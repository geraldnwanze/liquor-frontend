"use client";

import { archiveProductAction, deleteProductAction, duplicateProductAction } from "@/app/actions/admin-catalog";
import { ConfirmButton } from "@/components/admin/confirm-button";
import type { AdminProductStatus } from "@/lib/api/types";

export function ProductActions({ id, status }: { id: string; status: AdminProductStatus }) {
  const deletable = status === "draft" || status === "archived";
  return (
    <div className="flex flex-wrap items-start gap-3">
      <ConfirmButton label="Duplicate" confirmLabel="Yes, copy as draft" run={() => duplicateProductAction(id)} />
      {status !== "archived" && <ConfirmButton label="Archive" confirmLabel="Yes, archive" run={() => archiveProductAction(id)} />}
      {deletable && <ConfirmButton tone="danger" label="Delete" confirmLabel="Yes, delete" run={() => deleteProductAction(id)} />}
    </div>
  );
}
