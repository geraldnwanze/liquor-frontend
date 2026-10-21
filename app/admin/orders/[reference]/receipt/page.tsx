import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReceiptDocument } from "@/components/orders/receipt-document";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { Receipt } from "@/lib/api/types";

export const metadata: Metadata = { title: "Receipt" };

export default async function AdminReceipt({ params }: PageProps<"/admin/orders/[reference]/receipt">) {
  const { reference } = await params;
  await requireStaff(`/admin/orders/${reference}/receipt`);
  if (!/^[A-Z0-9]{8,16}$/.test(reference)) notFound();
  const { data } = await adminGet<{ data: Receipt }>(`/orders/${reference}/receipt`);
  if (!data) notFound();
  return <div className="mx-auto w-full max-w-3xl"><ReceiptDocument receipt={data.data} backHref={`/admin/orders/${reference}`} backLabel="Back to order" /></div>;
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
