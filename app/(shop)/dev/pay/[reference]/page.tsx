import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DevPayPanel } from "@/components/payments/dev-pay-panel";
import { isPaymentReference } from "@/lib/payments/polling";

export const metadata: Metadata = { title: "Test payment (development)", robots: { index: false, follow: false } };

export default function DevPayPage({ params }: PageProps<"/dev/pay/[reference]">) {
  // Hidden unless explicitly switched on. Never enable in production.
  if (process.env.ENABLE_FAKE_PAYMENTS !== "1") notFound();
  return (
    <Suspense fallback={null}>
      <Dev params={params} />
    </Suspense>
  );
}

async function Dev({ params }: Pick<PageProps<"/dev/pay/[reference]">, "params">) {
  const { reference } = await params;
  if (!isPaymentReference(reference)) notFound();
  return <DevPayPanel reference={reference} />;
}
