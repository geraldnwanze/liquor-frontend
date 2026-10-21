import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PaymentReturn } from "@/components/payments/payment-return";
import { isPaymentReference } from "@/lib/payments/polling";

// Private and transient: never indexed, never saved by the service worker (/payment is a private path).
export const metadata: Metadata = { title: "Confirming your payment", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function PaymentReturnPage({ params }: PageProps<"/payment/return/[reference]">) {
  return (
    <Suspense fallback={<p role="status" className="py-24 text-center text-muted">Confirming your payment…</p>}>
      <Return params={params} />
    </Suspense>
  );
}

async function Return({ params }: Pick<PageProps<"/payment/return/[reference]">, "params">) {
  const { reference } = await params;
  if (!isPaymentReference(reference)) notFound();
  // The gateway appends its own query parameters (trxref, status, transaction_id, ...). They are never read.
  return <PaymentReturn reference={reference} />;
}
