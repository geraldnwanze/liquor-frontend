"use client";

import { deletePageAction } from "@/app/actions/admin-pages";
import { ConfirmButton } from "@/components/admin/confirm-button";

export function DeletePageButton({ id, slug }: { id: string; slug: string }) {
  return <ConfirmButton label="Delete page" confirmLabel="Yes, delete" tone="danger" run={() => deletePageAction(id, slug)} />;
}
