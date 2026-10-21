import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPaymentGateways } from "@/lib/api/catalog";
import { OrderView } from "@/components/orders/order-view";
import { getMyOrder } from "@/lib/api/orders";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

export default function OrderPage({ params }: PageProps<"/orders/[reference]">) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Suspense fallback={<p role="status" className="py-16 text-center text-muted">Loading your order…</p>}>
        <OrderDetails params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetails({ params }: Pick<PageProps<"/orders/[reference]">, "params">) {
  const { reference } = await params;
  // Only the browser whose cart (or signed-in customer) placed this order can read it; anyone else gets the same 404 as an unknown reference.
  const order = await getMyOrder(reference);
  if (!order) notFound();
  const gateways = order.status === "pending_payment" ? await getPaymentGateways() : [];
  return <OrderView order={order} backHref="/" backLabel="Continue shopping" gateways={gateways} />;
}
