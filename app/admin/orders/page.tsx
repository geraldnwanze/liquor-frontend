import type { Metadata } from "next";
import Link from "next/link";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminOrderRow } from "@/lib/api/types";
import { filterParams, parseAdminOrderFilters } from "@/lib/admin/order-filters";
import { formatDate } from "@/lib/format";
import { PageHeader, panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { CollapsibleFilters } from "@/components/ui/collapsible-filters";
import { LiveQueryInput } from "@/components/admin/live-query-input";

export const metadata: Metadata = { title: "Orders" };

const options = (items: [string, string][]) => items.map(([v, l]) => <option key={v} value={v}>{l}</option>);
const TABS: { label: string; params: Record<string, string> }[] = [
  { label: "All", params: {} },
  { label: "To prepare", params: { status: "paid", fulfilment_status: "unfulfilled" } },
  { label: "Preparing", params: { status: "paid", fulfilment_status: "processing" } },
  { label: "Out for delivery", params: { status: "paid", fulfilment_status: "out_for_delivery" } },
  { label: "Delivery failed", params: { status: "paid", fulfilment_status: "delivery_failed" } },
  { label: "Awaiting payment", params: { status: "pending_payment" } },
];
const control = "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-ink";
const label = "flex flex-col gap-1 text-xs font-medium text-muted";

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  await requireStaff("/admin/orders");
  const f = parseAdminOrderFilters(await searchParams);
  const params = filterParams(f);
  const { data } = await adminGet<{ data: AdminOrderRow[]; meta: { current_page: number; last_page: number; total: number } }>("/orders", { ...params, page: f.page });
  if (!data) return <p role="alert">Orders could not be loaded.</p>;

  const link = (page: number) => `/admin/orders?${new URLSearchParams({ ...params, page: String(page) })}`;

  return (
    <>
      <PageHeader title="Orders" subtitle={`${data.meta.total} order${data.meta.total === 1 ? "" : "s"}${Object.keys(params).length ? " match your filters" : ""}`} />

      <nav aria-label="Quick filters" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const active = JSON.stringify(Object.entries(t.params).sort()) === JSON.stringify(Object.entries(params).sort());
          return (
            <Link key={t.label} href={t.params ? `/admin/orders?${new URLSearchParams(t.params)}` : "/admin/orders"} aria-current={active ? "page" : undefined}
              className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${active ? "border-burgundy bg-burgundy text-ivory" : "border-stone-300 bg-white text-ink hover:bg-stone-50"}`}>
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-5">
      <CollapsibleFilters label={`Filters and search${Object.keys(params).length > 0 ? ` (${Object.keys(params).length} on)` : ""}`} startOpen={Object.keys(params).length > 0} buttonClassName={`${panel} h-11 px-4 text-sm font-medium`}>
      <form method="get" role="search" aria-label="Filter orders" className={`${panel} grid gap-3 p-4 sm:grid-cols-3 xl:grid-cols-6`}>
        <label className={`${label} sm:col-span-3 xl:col-span-2`}>Search
          <LiveQueryInput defaultValue={f.q} placeholder="Reference, name, email or phone" className={control} />
        </label>
        <label className={label}>Order
          <select name="status" defaultValue={f.status} className={control}><option value="">Any</option>{options([["pending_payment", "Awaiting payment"], ["paid", "Paid"], ["cancelled", "Cancelled"], ["expired", "Expired"]])}</select>
        </label>
        <label className={label}>Payment
          <select name="payment_status" defaultValue={f.payment_status} className={control}><option value="">Any</option>{options([["pending", "Unpaid"], ["paid", "Paid"], ["failed", "Failed"], ["partially_refunded", "Part refunded"], ["refunded", "Refunded"]])}</select>
        </label>
        <label className={label}>Fulfilment
          <select name="fulfilment_status" defaultValue={f.fulfilment_status} className={control}><option value="">Any</option>{options([["unfulfilled", "To prepare"], ["processing", "Preparing"], ["out_for_delivery", "Out for delivery"], ["delivered", "Delivered"], ["delivery_failed", "Delivery failed"]])}</select>
        </label>
        <label className={label}>From
          <input type="date" name="from" defaultValue={f.from} className={control} />
        </label>
        <label className={label}>To
          <input type="date" name="to" defaultValue={f.to} className={control} />
        </label>
        <div className="flex items-end justify-end gap-2 sm:col-span-3 xl:col-span-4">
          {Object.keys(params).length > 0 && <Link href="/admin/orders" className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-muted hover:text-ink">Clear</Link>}
          <button className="h-10 rounded-lg bg-burgundy px-6 text-sm font-semibold text-ivory hover:bg-burgundy-deep">Apply filters</button>
        </div>
      </form>
      </CollapsibleFilters>
      </div>

      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Orders, newest first</caption>
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="px-3 py-3 font-medium">Order</th>
              <th scope="col" className="px-3 py-3 font-medium">Customer</th>
              <th scope="col" className="px-3 py-3 font-medium">Payment</th>
              <th scope="col" className="px-3 py-3 font-medium">Fulfilment</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Total</th>
              <th scope="col" className="px-3 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.data.map((o) => (
              <tr key={o.reference} className="hover:bg-stone-50">
                <th scope="row" className="px-3 py-3 font-semibold"><Link href={`/admin/orders/${o.reference}`} className="font-mono text-[13px] text-burgundy hover:underline">{o.reference}</Link></th>
                <td className="px-3 py-3"><span className="block whitespace-nowrap font-medium">{o.customer.name}</span><span className="block text-xs text-muted">{o.city}</span></td>
                <td className="px-3 py-3"><span className="flex flex-wrap gap-1.5"><StatusBadge kind="order" value={o.status} />{o.status === "paid" && o.payment_status !== "paid" && <StatusBadge kind="payment" value={o.payment_status} />}</span></td>
                <td className="px-3 py-3">{o.status === "paid" ? <StatusBadge kind="fulfilment" value={o.fulfilment_status} /> : <span className="text-muted">-</span>}</td>
                <td className="px-3 py-3 text-right font-medium tabular-nums">{o.total.formatted}</td>
                <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDate(o.created_at)}</td>
              </tr>
            ))}
            {data.data.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">No orders match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {data.meta.last_page > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Page {data.meta.current_page} of {data.meta.last_page}</span>
          <span className="flex gap-2">
            {data.meta.current_page > 1 && <Link href={link(data.meta.current_page - 1)} className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium">Previous</Link>}
            {data.meta.current_page < data.meta.last_page && <Link href={link(data.meta.current_page + 1)} className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium">Next</Link>}
          </span>
        </nav>
      )}
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
