"use client";

import Link from "next/link";
import { deleteProductAction } from "@/app/actions/admin-catalog";
import { ConfirmButton } from "@/components/admin/confirm-button";
import type { AdminProductStatus } from "@/lib/api/types";

/** Delete from the products table. Only draft and archived products can go; live ones are archived first. */
export function ProductRowDelete({ id, name, status }: { id: string; name: string; status: AdminProductStatus }) {
  if (status === "draft" || status === "archived") {
    return <ConfirmButton tone="danger" label="Delete" confirmLabel={`Yes, delete ${name.length > 24 ? "this product" : name}`} run={() => deleteProductAction(id)} />;
  }
  return (
    <span className="flex items-center gap-2 text-xs text-muted">
      <button type="button" disabled title="Archive the product first" className="h-10 cursor-not-allowed rounded-lg border border-stone-200 px-4 text-sm font-medium text-stone-400">Delete</button>
      <Link href={`/admin/products/${id}`} className="underline underline-offset-4 hover:text-ink">Archive first</Link>
    </span>
  );
}
