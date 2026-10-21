import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaymentGateways } from "@/lib/api/catalog";
import { OrderView } from "@/components/orders/order-view";
import { getMyOrderByReference, requireUser } from "@/lib/api/account";

export const metadata: Metadata = { title: "Order details" };

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[reference]">) {
  const { reference } = await params;
  await requireUser(`/account/orders/${reference}`);
  const order = await getMyOrderByReference(reference);
  if (!order) notFound();

  const gateways = order.status === "pending_payment" ? await getPaymentGateways() : [];
  return <OrderView order={order} backHref="/account/orders" backLabel="Back to your orders" gateways={gateways} />;
}
