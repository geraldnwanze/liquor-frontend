import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReceiptDocument } from "@/components/orders/receipt-document";
import { getMyReceipt } from "@/lib/api/orders";

export const metadata: Metadata = { title: "Receipt", robots: { index: false, follow: false } };

export default function ReceiptPage({ params }: PageProps<"/orders/[reference]/receipt">) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 print:max-w-none print:p-0">
      <Suspense fallback={<p role="status" className="py-16 text-center text-muted">Loading your receipt…</p>}>
        <Receipt params={params} />
      </Suspense>
    </div>
  );
}

async function Receipt({ params }: Pick<PageProps<"/orders/[reference]/receipt">, "params">) {
  const { reference } = await params;
  const receipt = await getMyReceipt(reference);
  if (receipt === null) notFound();

  if (receipt === "unavailable") {
    return (
      <div className="rounded-2xl border border-burgundy/15 bg-white p-6">
        <h1 className="text-2xl font-semibold text-accent">No receipt yet</h1>
        <p className="mt-2 text-muted">A receipt is available once your order has been paid.</p>
        <Link href={`/orders/${reference}`} className="mt-4 inline-flex min-h-12 items-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">Back to your order</Link>
      </div>
    );
  }

  return <ReceiptDocument receipt={receipt} backHref={`/orders/${receipt.number}`} backLabel="Back to your order" />;
}
