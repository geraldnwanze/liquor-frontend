"use client";

import { deleteDiscountAction } from "@/app/actions/admin-discounts";
import { ConfirmButton } from "@/components/admin/confirm-button";

export function DeleteDiscountButton({ id }: { id: string }) {
  return <ConfirmButton tone="danger" label="Delete discount" confirmLabel="Yes, delete" run={() => deleteDiscountAction(id)} />;
}
