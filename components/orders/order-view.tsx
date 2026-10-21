import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { PayPanel } from "@/components/payments/pay-panel";
import type { Order, PaymentGateway } from "@/lib/api/types";
import { orderStatusLabel, orderStatusTone } from "@/lib/orders/status";

/** One order's details. Shared by the guest confirmation page and the signed-in account order page. */
export function OrderView({ order, backHref, backLabel, gateways = [] }: { order: Order; backHref: string; backLabel: string; gateways?: PaymentGateway[] }) {
  const heading =
    order.status === "paid" ? "Thank you! Your order is paid" : order.status === "pending_payment" ? "Order placed: payment needed" : order.status === "expired" ? "This order has expired" : "This order was cancelled";
  const time = order.reservation_expires_at
    ? new Intl.DateTimeFormat("en-NG", { timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(order.reservation_expires_at))
    : null;

  return (
    <>
      <p className="text-sm uppercase tracking-[0.2em] text-gold">Order {order.reference}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold text-accent">{heading}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${orderStatusTone(order.status)}`}>{orderStatusLabel(order.status)}</span>
      </div>

      {order.status === "pending_payment" && (
        <>
          <p className="mt-3 rounded-lg border-l-4 border-gold bg-white p-3 text-sm">
            Your items are reserved{time ? ` until ${time}` : ""}. Complete the payment to confirm your order; unpaid orders are released automatically.
          </p>
          <PayPanel orderReference={order.reference} totalFormatted={order.total.formatted} gateways={gateways} />
        </>
      )}
      {order.status === "paid" && <p className="mt-3 text-muted">We&apos;ve received your payment. A confirmation has been sent to {order.customer.email}.</p>}
      {(order.status === "expired" || order.status === "cancelled") && (
        <p className="mt-3 text-muted">The reserved items were released. Your cart is still saved if you&apos;d like to try again.</p>
      )}

      {order.timeline && order.timeline.length > 0 && (
        <section className="mt-6 rounded-2xl border border-burgundy/15 bg-white p-4" aria-labelledby="tracking-heading">
          <h2 id="tracking-heading" className="text-lg font-semibold text-accent">
            Order progress
          </h2>
          {order.fulfilment && order.status === "paid" && <p className="mt-1 text-sm font-medium">{order.fulfilment.label}</p>}
          <ol className="mt-3 space-y-3 border-l-2 border-gold/25 pl-4">
            {order.timeline.map((step, i) => (
              <li key={`${step.type}-${step.at}-${i}`} className="relative text-sm">
                <span aria-hidden="true" className={`absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full ${i === order.timeline!.length - 1 ? "bg-gold" : "bg-gold/40"}`} />
                <p className={i === order.timeline!.length - 1 ? "font-semibold" : ""}>{step.label}</p>
                <p className="text-muted">{formatDateTime(step.at)}</p>
              </li>
            ))}
          </ol>
          {order.shipment && (order.shipment.carrier || order.shipment.tracking_reference) && (
            <p className="mt-4 border-t border-burgundy/10 pt-3 text-sm">
              {order.shipment.carrier && <span>Carrier: {order.shipment.carrier}. </span>}
              {order.shipment.tracking_reference && <span>Tracking reference: <strong>{order.shipment.tracking_reference}</strong>. </span>}
              {order.shipment.estimated_delivery_at && order.fulfilment?.status !== "delivered" && <span>Expected {formatDateTime(order.shipment.estimated_delivery_at)}.</span>}
            </p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-burgundy/15 bg-white p-4" aria-labelledby="items-heading">
        <h2 id="items-heading" className="text-lg font-semibold text-accent">
          Items
        </h2>
        <ul className="mt-2 divide-y divide-burgundy/10">
          {order.items.map((item) => (
            <li key={item.sku} className="flex justify-between gap-3 py-3 text-sm">
              <span>
                {item.product_name}{" "}
                <span className="text-muted">
                  · {item.variant_name} × {item.quantity}
                </span>
              </span>
              <span className="font-medium">{item.line_total.formatted}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t border-burgundy/10 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{order.subtotal.formatted}</dd>
          </div>
          {order.discount.kobo > 0 && (
            <div className="flex justify-between">
              <dt>Discount{order.discount_code ? ` (${order.discount_code})` : ""}</dt>
              <dd>-{order.discount.formatted}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Delivery ({order.delivery.zone})</dt>
            <dd>{order.delivery_fee.kobo === 0 ? "Free" : order.delivery_fee.formatted}</dd>
          </div>
          <div className="flex justify-between border-t border-burgundy/10 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{order.total.formatted}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2" aria-label="Delivery and contact">
        <div className="rounded-2xl border border-burgundy/15 bg-white p-4 text-sm">
          <h2 className="font-semibold text-accent">Delivering to</h2>
          <p className="mt-1">{order.customer.name}</p>
          <p>{order.delivery.address}</p>
          <p>
            {order.delivery.city}, {order.delivery.state}
          </p>
          {order.delivery.instructions && <p className="mt-1 text-muted">{order.delivery.instructions}</p>}
        </div>
        <div className="rounded-2xl border border-burgundy/15 bg-white p-4 text-sm">
          <h2 className="font-semibold text-accent">Contact</h2>
          <p className="mt-1">{order.customer.email}</p>
          <p>{order.customer.phone}</p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        {order.status === "paid" && (
          <Link href={`/orders/${order.reference}/receipt`} className="inline-flex min-h-12 items-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">
            View receipt
          </Link>
        )}
        <Link href={backHref} className="inline-flex min-h-12 items-center rounded-full border border-burgundy px-6 font-semibold text-accent">
          {backLabel}
        </Link>
      </div>
    </>
  );
}
