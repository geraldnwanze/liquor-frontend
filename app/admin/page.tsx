import Link from "next/link";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";
import { can } from "@/lib/auth/permissions";
import { StatusBadge } from "@/components/admin/status-badge";
import type { AdminOrderRow, AdminOrderSummary, ReportSales } from "@/lib/api/types";
import { addDays, lagosToday } from "@/lib/admin/report-range";
import { formatDateTime } from "@/lib/format";

const CARDS: { key: keyof AdminOrderSummary["fulfilment"]; label: string; hint: string; accent: string }[] = [
  { key: "unfulfilled", label: "To prepare", hint: "Paid, not started", accent: "bg-amber-500" },
  { key: "processing", label: "Preparing", hint: "Being packed", accent: "bg-sky-500" },
  { key: "out_for_delivery", label: "Out for delivery", hint: "With the rider", accent: "bg-indigo-500" },
  { key: "delivery_failed", label: "Delivery failed", hint: "Needs a decision", accent: "bg-red-500" },
];

/** Every permission that opens at least one admin screen: any staff member with one of these gets a dashboard. */
const WORKSPACE_PERMISSIONS = ["orders.view", "orders.manage", "catalog.manage", "reviews.moderate", "inventory.manage", "customers.manage", "promotions.manage", "content.manage", "shipping.manage", "reports.view", "settings.manage", "staff.manage"];

type Stat = { label: string; value: string; hint: string; href: string };

/** The numbers each role cares about, fetched only for what the signed-in person is allowed to open. */
async function workspaceStats(user: Awaited<ReturnType<typeof requireStaff>>): Promise<Stat[]> {
  const total = async (path: string, query?: Record<string, string | number>) => (await adminGet<{ meta: { total: number } }>(path, query)).data?.meta.total ?? null;
  const today = lagosToday();
  const [reviews, customers, subscribers, pages, sales, lowStock] = await Promise.all([
    can(user, "reviews.moderate") ? total("/reviews", { status: "pending" }) : null,
    can(user, "customers.manage") ? total("/customers") : null,
    can(user, "promotions.manage") ? adminGet<{ summary: { active: number } }>("/newsletter").then((r) => r.data?.summary.active ?? null) : null,
    can(user, "content.manage") ? adminGet<{ data: { status: string }[] }>("/pages").then((r) => r.data?.data ?? null) : null,
    can(user, "reports.view") ? adminGet<{ data: ReportSales }>("/reports/sales", { from: addDays(today, -6), to: today, group: "day" }).then((r) => r.data?.data ?? null) : null,
    can(user, "inventory.manage") ? total("/inventory/low-stock") : null,
  ]);

  const stats: Stat[] = [];
  if (sales) stats.push({ label: "Sales, last 7 days", value: sales.totals.net.formatted, hint: `${sales.totals.orders} paid orders, after refunds`, href: "/admin/reports" });
  if (lowStock !== null) stats.push({ label: "Low or out of stock", value: String(lowStock), hint: "Variants at or under their alert level", href: "/admin/products" });
  if (reviews !== null) stats.push({ label: "Reviews waiting", value: String(reviews), hint: "Customer reviews to approve", href: "/admin/reviews" });
  if (customers !== null) stats.push({ label: "Customers", value: String(customers), hint: "With an account", href: "/admin/customers" });
  if (subscribers !== null) stats.push({ label: "Newsletter subscribers", value: String(subscribers), hint: "Confirmed by email", href: "/admin/newsletter" });
  if (pages) stats.push({ label: "Information pages", value: String(pages.filter((p) => p.status === "published").length), hint: `${pages.filter((p) => p.status === "draft").length} draft`, href: "/admin/pages" });
  return stats;
}

export default async function AdminDashboard() {
  const user = await requireStaff("/admin", ...WORKSPACE_PERMISSIONS);
  const stats = await workspaceStats(user);
  const seesOrders = can(user, "orders.view") || can(user, "orders.manage");
  const welcome = (
    <PageHeader title="Dashboard" subtitle={`Welcome, ${user.name}.${seesOrders ? " What needs doing right now." : " Here is your workspace."}`} />
  );
  const statCards = stats.length > 0 && (
    <section aria-label="Your workspace" className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((st) => (
        <Link key={st.label} href={st.href} className={`${panel} block p-5 transition-shadow hover:shadow-md`}>
          <span className="block text-sm font-medium text-muted">{st.label}</span>
          <span className="mt-2 block text-3xl font-semibold tabular-nums">{st.value}</span>
          <span className="mt-1 block text-xs text-muted">{st.hint}</span>
        </Link>
      ))}
    </section>
  );

  if (!seesOrders) {
    return (
      <>
        {welcome}
        {statCards || <p className={`${panel} p-8 text-center text-muted`}>Use the menu to get started.</p>}
      </>
    );
  }

  const [{ data }, recent] = await Promise.all([
    adminGet<{ data: AdminOrderSummary }>("/orders/summary"),
    adminGet<{ data: AdminOrderRow[] }>("/orders", { per_page: 6 }),
  ]);
  const s = data?.data;
  if (!s) return <p role="alert">The dashboard could not be loaded.</p>;

  return (
    <>
      {welcome}
      {statCards}

      {s.payments_needing_review > 0 && (
        <Link href="/admin/orders" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full bg-red-500" />
          <span><strong>{s.payments_needing_review} payment{s.payments_needing_review === 1 ? "" : "s"} need a decision.</strong> Money was received but the order was not fulfilled automatically.</span>
        </Link>
      )}

      <section aria-label="Today" className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={`${panel} p-5`}>
          <p className="text-sm font-medium text-muted">Sales today</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{s.today.sales.formatted}</p>
          <p className="mt-1 text-xs text-muted">Paid orders today (Lagos time), before refunds</p>
        </div>
        <div className={`${panel} p-5`}>
          <p className="text-sm font-medium text-muted">Orders paid today</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{s.today.orders_paid}</p>
        </div>
        <div className={`${panel} p-5`}>
          <p className="text-sm font-medium text-muted">Orders placed today</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{s.today.orders_placed}</p>
          <p className="mt-1 text-xs text-muted">Including unpaid</p>
        </div>
      </section>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Needs action</h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((c) => (
          <li key={c.key}>
            <Link href={`/admin/orders?status=paid&fulfilment_status=${c.key}`} className={`${panel} group relative block overflow-hidden p-5 transition-shadow hover:shadow-md`}>
              <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${c.accent}`} />
              <span className="block text-sm font-medium text-muted">{c.label}</span>
              <span className="mt-2 block text-4xl font-semibold tabular-nums text-ink">{s.fulfilment[c.key]}</span>
              <span className="mt-1 block text-xs text-muted">{c.hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wider text-muted">Orders overall</h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([["pending_payment", "Awaiting payment"], ["paid", "Paid"], ["cancelled", "Cancelled"], ["expired", "Expired"]] as const).map(([key, label]) => (
          <li key={key}>
            <Link href={`/admin/orders?status=${key}`} className={`${panel} block p-4 transition-shadow hover:shadow-md`}>
              <span className="block text-xs font-medium text-muted">{label}</span>
              <span className="mt-1 block text-2xl font-semibold tabular-nums">{s.status[key]}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mb-3 mt-10 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Recent orders</h2>
        <Link href="/admin/orders" className="text-sm font-medium text-burgundy hover:underline">View all</Link>
      </div>
      <div className={`${panel} divide-y divide-stone-100`}>
        {(recent.data?.data ?? []).map((o) => (
          <Link key={o.reference} href={`/admin/orders/${o.reference}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-stone-50">
            <span>
              <span className="block font-mono text-[13px] font-semibold text-burgundy">{o.reference}</span>
              <span className="block text-xs text-muted">{o.customer.name} · {formatDateTime(o.created_at)}</span>
            </span>
            <span className="flex items-center gap-2">
              <StatusBadge kind="order" value={o.status} />
              {o.status === "paid" && <StatusBadge kind="fulfilment" value={o.fulfilment_status} />}
              <span className="w-24 text-right font-medium tabular-nums">{o.total.formatted}</span>
            </span>
          </Link>
        ))}
        {(recent.data?.data ?? []).length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">No orders yet.</p>}
      </div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
