import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerNotes } from "@/components/admin/customer-notes";
import { CustomerStatus } from "@/components/admin/customer-status";
import { PageHeader, panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminCustomer } from "@/lib/api/types";
import { can } from "@/lib/auth/permissions";
import { formatDate, formatDateTime } from "@/lib/format";
import { isUuid } from "@/lib/ids";

export const metadata: Metadata = { title: "Customer" };

const card = `${panel} p-5`;
const heading = "text-sm font-semibold uppercase tracking-wider text-muted";

export default async function AdminCustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const user = await requireStaff(`/admin/customers/${id}`, "customers.manage");
  if (!isUuid(id)) notFound();
  const { data } = await adminGet<{ data: AdminCustomer }>(`/customers/${id}`);
  if (!data) notFound();
  const c = data.data;
  const canOpenOrders = can(user, "orders.view") || can(user, "orders.manage");

  return (
    <>
      <Link href="/admin/customers" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><span aria-hidden="true">←</span> All customers</Link>
      <PageHeader title={c.name} subtitle={`Customer since ${formatDate(c.joined_at)}${c.is_active ? "" : " · suspended"}`} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className={card} aria-labelledby="orders-h">
            <h2 id="orders-h" className={`${heading} mb-3`}>Orders</h2>
            <dl className="mb-4 grid grid-cols-3 gap-4 text-sm">
              <div><dt className="text-xs text-muted">All orders</dt><dd className="text-xl font-semibold tabular-nums">{c.stats.orders}</dd></div>
              <div><dt className="text-xs text-muted">Paid</dt><dd className="text-xl font-semibold tabular-nums">{c.stats.paid_orders}</dd></div>
              <div><dt className="text-xs text-muted">Spent (before refunds)</dt><dd className="text-xl font-semibold tabular-nums">{c.stats.spent.formatted}</dd></div>
            </dl>
            <ul className="divide-y divide-stone-100 border-t border-stone-200 text-sm">
              {c.orders.map((o) => (
                <li key={o.reference} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span>
                    {canOpenOrders ? <Link href={`/admin/orders/${o.reference}`} className="font-mono text-[13px] font-semibold text-burgundy hover:underline">{o.reference}</Link> : <span className="font-mono text-[13px] font-semibold">{o.reference}</span>}
                    <span className="block text-xs text-muted">{formatDateTime(o.created_at)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge kind="order" value={o.status} />
                    {o.status === "paid" && <StatusBadge kind="fulfilment" value={o.fulfilment_status} />}
                    <span className="w-24 text-right font-medium tabular-nums">{o.total.formatted}</span>
                  </span>
                </li>
              ))}
              {c.orders.length === 0 && <li className="py-4 text-muted">No orders yet.</li>}
            </ul>
          </section>

          <section className={card} aria-labelledby="notes-h">
            <h2 id="notes-h" className={`${heading} mb-3`}>Support notes</h2>
            <CustomerNotes customerId={c.id} notes={c.notes} />
          </section>
        </div>

        <div className="space-y-6">
          <section className={card} aria-labelledby="status-h">
            <h2 id="status-h" className={`${heading} mb-3`}>Account status</h2>
            {c.erased ? <p className="text-sm text-muted">This customer&apos;s personal details were erased at their request. Their orders are kept.</p> : <CustomerStatus customerId={c.id} active={c.is_active} suspendedAt={c.suspended_at} reason={c.suspension_reason} />}
          </section>
          <section className={card} aria-labelledby="contact-h">
            <h2 id="contact-h" className={`${heading} mb-3`}>Contact</h2>
            <p className="text-sm">{c.email}<br />{c.phone ?? "No phone number"}</p>
            {c.date_of_birth && <p className="mt-2 text-xs text-muted">Date of birth on file: {formatDate(c.date_of_birth)}</p>}
          </section>
          <section className={card} aria-labelledby="addr-h">
            <h2 id="addr-h" className={`${heading} mb-3`}>Saved addresses</h2>
            <ul className="space-y-3 text-sm">
              {c.addresses.map((a, i) => (
                <li key={i}>
                  <p className="font-medium">{a.label ?? a.recipient_name}{a.is_default && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-normal text-muted">Default</span>}</p>
                  <p className="text-muted">{a.recipient_name}, {a.phone}<br />{a.address_line}, {a.city}, {a.state}</p>
                  {a.instructions && <p className="text-xs text-muted">Instructions: {a.instructions}</p>}
                </li>
              ))}
              {c.addresses.length === 0 && <li className="text-muted">None saved.</li>}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
