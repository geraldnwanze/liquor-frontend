"use client";

import { restoreTrashAction } from "@/app/actions/admin-trash";
import { ConfirmButton } from "@/components/admin/confirm-button";

export function RestoreButton({ type, id }: { type: string; id: string }) {
  return <ConfirmButton label="Restore" confirmLabel="Yes, restore" run={() => restoreTrashAction(type, id)} />;
}
