import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelForm, FulfilmentForm, NoteForm, RefundForm, ShipmentForm } from "@/components/admin/order-actions";
import { PageHeader, panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminOrder } from "@/lib/api/types";
import { can } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Order" };

const card = `${panel} p-5`;
const heading = "text-sm font-semibold uppercase tracking-wider text-muted";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[reference]">) {
  const { reference } = await params;
  const user = await requireStaff(`/admin/orders/${reference}`);
  if (!/^[A-Z0-9]{8,16}$/.test(reference)) notFound();
  const { data } = await adminGet<{ data: AdminOrder }>(`/orders/${reference}`);
  if (!data) notFound();
  const o = data.data;
  const manage = can(user, "orders.manage");
  const refund = can(user, "orders.refund");
  const paid = o.status === "paid";

  return (
    <>
      <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <span aria-hidden="true">←</span> All orders
      </Link>
      <PageHeader title={`Order ${o.reference}`} subtitle={`Placed ${formatDateTime(o.created_at)}${o.paid_at ? ` · paid ${formatDateTime(o.paid_at)}` : ""}`}>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="order" value={o.status} />
          {paid && o.payment_status !== "paid" && <StatusBadge kind="payment" value={o.payment_status} />}
          {paid && <StatusBadge kind="fulfilment" value={o.fulfilment_status} />}
          {paid && <Link href={`/admin/orders/${o.reference}/receipt`} className="ml-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50">Receipt</Link>}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className={card} aria-labelledby="items">
            <h2 id="items" className={heading}>Items</h2>
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {o.items.map((i) => (
                <li key={i.sku} className="flex justify-between gap-4 py-3">
                  <span><span className="font-medium">{i.product_name}</span><span className="block text-xs text-muted">{i.variant_name} · {i.sku} · qty {i.quantity}</span></span>
                  <span className="font-medium tabular-nums">{i.line_total.formatted}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t border-stone-200 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{o.subtotal.formatted}</dd></div>
              {o.discount.kobo > 0 && <div className="flex justify-between"><dt className="text-muted">Discount{o.discount_code ? ` (${o.discount_code})` : ""}</dt><dd className="tabular-nums">-{o.discount.formatted}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="tabular-nums">{o.delivery_fee.formatted}</dd></div>
              <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{o.total.formatted}</dd></div>
            </dl>
          </section>

          <section className={card} aria-labelledby="customer">
            <h2 id="customer" className={heading}>Customer and delivery</h2>
            <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="font-medium">{o.customer.name} <span className="ml-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-normal text-muted">{o.customer.has_account ? "Account" : "Guest"}</span></p>
                <p className="mt-1 text-muted">{o.customer.email}<br />{o.customer.phone}</p>
              </div>
              <div>
                <p>{o.delivery.address}<br />{o.delivery.city}, {o.delivery.state}</p>
                <p className="mt-1 text-xs text-muted">Zone: {o.delivery.zone}</p>
              </div>
            </div>
            {o.delivery.instructions && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Instructions: {o.delivery.instructions}</p>}
            <p className="mt-3 text-xs text-muted">{o.age_confirmed_at ? `Age confirmed ${formatDateTime(o.age_confirmed_at)} (self-declared, not proof of age)` : "Age not confirmed"}</p>
          </section>

          <section className={card} aria-labelledby="payments">
            <h2 id="payments" className={heading}>Payments and refunds</h2>
            {o.payments.length === 0 && <p className="mt-3 text-sm text-muted">No payment attempts.</p>}
            <ul className="mt-3 divide-y divide-stone-100">
              {o.payments.map((p) => {
                const remaining = p.amount.kobo - p.refunded.kobo;
                return (
                  <li key={p.reference} className="py-3 text-sm first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2"><span className="font-medium capitalize">{p.gateway}</span><StatusBadge kind="paymentState" value={p.state} /></span>
                      <span className="font-medium tabular-nums">{p.amount.formatted}</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted">{p.reference}</p>
                    {p.review_reason && <p className="mt-1 text-xs text-red-800">Review: {p.review_reason}</p>}
                    {p.refunded.kobo > 0 && <p className="mt-1 text-xs text-muted">Refunded {p.refunded.formatted}</p>}
                    {refund && p.state === "succeeded" && remaining > 0 && (
                      <details className="mt-3 rounded-lg border border-stone-200 p-3">
                        <summary className="cursor-pointer text-sm font-medium">Refund this payment</summary>
                        <div className="mt-3"><RefundForm orderReference={o.reference} paymentReference={p.reference} remainingKobo={remaining} /></div>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
            {o.refunds.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-stone-200 pt-3 text-sm">
                {o.refunds.map((r, i) => <li key={i} className="flex justify-between gap-3"><span className="text-muted">{r.reason}</span><span className="whitespace-nowrap font-medium tabular-nums">{r.amount.formatted} <span className="text-xs font-normal text-muted">{r.state}</span></span></li>)}
              </ul>
            )}
          </section>

          <section className={card} aria-labelledby="history">
            <h2 id="history" className={heading}>History</h2>
            <ol className="mt-4 space-y-4 border-l-2 border-stone-200 pl-5 text-sm">
              {[...o.events].reverse().map((e, i) => (
                <li key={i} className="relative">
                  <span aria-hidden="true" className={`absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full ${e.customer_visible ? "bg-burgundy" : "bg-stone-400"}`} />
                  <p><span className="font-medium capitalize">{e.type.replaceAll("_", " ")}</span>{e.to ? <span className="text-muted">: {e.from ? `${e.from} → ` : ""}{e.to}</span> : null}{!e.customer_visible && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-muted">internal</span>}</p>
                  {e.note && <p className="mt-0.5">{e.note}</p>}
                  <p className="text-xs text-muted">{formatDateTime(e.at)}{e.by ? ` · ${e.by}` : ""}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {manage && (
          <div className="space-y-6">
            {paid && <section className={card} aria-labelledby="fulfil"><h2 id="fulfil" className={heading}>Fulfilment</h2><div className="mt-3"><FulfilmentForm reference={o.reference} next={o.next_fulfilment} /></div></section>}
            {paid && <section className={card} aria-labelledby="ship"><h2 id="ship" className={heading}>Dispatch</h2><div className="mt-3"><ShipmentForm reference={o.reference} shipment={o.shipment} /></div></section>}
            <section className={card} aria-labelledby="note"><h2 id="note" className={heading}>Internal note</h2><div className="mt-3"><NoteForm reference={o.reference} /></div></section>
            {o.can_cancel && (!paid || refund) && <section className={`${card} border-red-200`} aria-labelledby="cancel"><h2 id="cancel" className={`${heading} text-red-800`}>Cancel order</h2><div className="mt-3"><CancelForm reference={o.reference} paid={paid} /></div></section>}
          </div>
        )}
      </div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
