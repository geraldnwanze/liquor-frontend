import type { Metadata } from "next";
import Link from "next/link";
import { DownloadCsv } from "@/components/admin/download-csv";
import { PageHeader, panel } from "@/components/admin/page-header";
import { SalesChart } from "@/components/admin/sales-chart";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { ReportDiscounts, ReportProducts, ReportSales, ReportStock } from "@/lib/api/types";
import { lagosToday, parseReportRange, periodLabel, presets } from "@/lib/admin/report-range";
import { can } from "@/lib/auth/permissions";
import { koboToNairaInput, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

const card = `${panel} p-5`;
const heading = "text-sm font-semibold uppercase tracking-wider text-muted";
const control = "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm";
const naira = (kobo: number) => koboToNairaInput(kobo) || "0";

export default async function AdminReports({ searchParams }: PageProps<"/admin/reports">) {
  const user = await requireStaff("/admin/reports", "reports.view");
  const raw = await searchParams;
  const range = parseReportRange(raw, lagosToday());
  const sort = (Array.isArray(raw.sort) ? raw.sort[0] : raw.sort) === "units" ? "units" : "revenue";
  const query = { from: range.from, to: range.to, group: range.group };

  const [sales, products, discounts, stock] = await Promise.all([
    adminGet<{ data: ReportSales }>("/reports/sales", query),
    adminGet<{ data: ReportProducts }>("/reports/products", { ...query, sort, limit: 10 }),
    adminGet<{ data: ReportDiscounts }>("/reports/discounts", query),
    adminGet<{ data: ReportStock }>("/reports/stock"),
  ]);
  if (!sales.data || !products.data || !discounts.data || !stock.data) return <p role="alert">Reports could not be loaded.</p>;
  const s = sales.data.data;
  const p = products.data.data;
  const d = discounts.data.data;
  const st = stock.data.data;
  const link = (extra: Record<string, string>) => `/admin/reports?${new URLSearchParams({ from: range.from, to: range.to, group: range.group, ...extra })}`;
  const canOpenProducts = can(user, "catalog.manage");

  const cards: [string, string, string?][] = [
    ["Sales", s.totals.gross.formatted, "Paid orders, including delivery"],
    ["Orders", String(s.totals.orders)],
    ["Average order", s.totals.average_order.formatted],
    ["Discounts given", s.totals.discounts.formatted, "Taken off paid orders"],
    ["Refunded", s.totals.refunded.formatted, "Partial refunds on these orders"],
    ["After refunds", s.totals.net.formatted],
  ];

  return (
    <>
      <PageHeader title="Reports" subtitle={`${formatDate(`${range.from}T12:00:00+01:00`)} to ${formatDate(`${range.to}T12:00:00+01:00`)} · Nigerian time · paid orders only`} />

      <section aria-label="Choose dates" className={`${card} mb-6`}>
        <nav aria-label="Quick ranges" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {presets(lagosToday()).map((preset) => {
            const active = preset.from === range.from && preset.to === range.to;
            return (
              <Link key={preset.label} href={`/admin/reports?${new URLSearchParams({ from: preset.from, to: preset.to })}`} aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${active ? "border-burgundy bg-burgundy text-ivory" : "border-stone-300 bg-white hover:bg-stone-50"}`}>
                {preset.label}
              </Link>
            );
          })}
        </nav>
        <form method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">From<input type="date" name="from" defaultValue={range.from} className={control} /></label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">To<input type="date" name="to" defaultValue={range.to} className={control} /></label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">Group by
            <select name="group" defaultValue={range.group} className={control}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select>
          </label>
          <button className="h-10 rounded-lg bg-burgundy px-6 text-sm font-semibold text-ivory hover:bg-burgundy-deep">Apply</button>
        </form>
      </section>

      <ul aria-label="Totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, hint]) => (
          <li key={label} className={`${panel} p-5`}>
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
          </li>
        ))}
      </ul>

      <section className={`${card} mt-6`} aria-labelledby="sales-h">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="sales-h" className={heading}>Sales per {range.group}</h2>
          <DownloadCsv filename={`sales-${range.from}-to-${range.to}.csv`} rows={[
            ["Period", "Orders", "Sales (NGN)", "Discounts (NGN)", "Refunded (NGN)", "After refunds (NGN)"],
            ...s.series.map((r) => [r.period, r.orders, naira(r.gross.kobo), naira(r.discounts.kobo), naira(r.refunded.kobo), naira(r.net.kobo)]),
          ]} />
        </div>
        {s.totals.orders === 0 ? <p className="py-10 text-center text-sm text-muted">No paid orders in this range.</p> : <SalesChart rows={s.series} group={range.group} />}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">View as a table</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">Sales per {range.group}</caption>
              <thead><tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-muted"><th scope="col" className="py-2 font-medium">Period</th><th scope="col" className="py-2 text-right font-medium">Orders</th><th scope="col" className="py-2 text-right font-medium">Sales</th><th scope="col" className="py-2 text-right font-medium">Discounts</th><th scope="col" className="py-2 text-right font-medium">Refunded</th></tr></thead>
              <tbody className="divide-y divide-stone-100">
                {s.series.map((r) => (
                  <tr key={r.period}><th scope="row" className="py-2 font-medium">{periodLabel(r.period, range.group)}</th><td className="py-2 text-right tabular-nums">{r.orders}</td><td className="py-2 text-right tabular-nums">{r.gross.formatted}</td><td className="py-2 text-right tabular-nums">{r.discounts.formatted}</td><td className="py-2 text-right tabular-nums">{r.refunded.formatted}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className={card} aria-labelledby="prod-h">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="prod-h" className={heading}>Top products</h2>
            <div className="flex items-center gap-2">
              <nav aria-label="Rank by" className="flex gap-1 text-sm">
                {(["revenue", "units"] as const).map((k) => <Link key={k} href={link({ sort: k })} aria-current={sort === k ? "page" : undefined} className={`rounded-full px-3 py-1 ${sort === k ? "bg-burgundy text-ivory" : "hover:bg-stone-100"}`}>{k === "revenue" ? "By revenue" : "By units"}</Link>)}
              </nav>
              <DownloadCsv filename={`top-products-${range.from}-to-${range.to}.csv`} rows={[["SKU", "Product", "Variant", "Units", "Orders", "Revenue (NGN)"], ...p.products.map((r) => [r.sku, r.product, r.variant, r.units, r.orders, naira(r.revenue.kobo)])]} />
            </div>
          </div>
          {p.products.length === 0 ? <p className="py-6 text-sm text-muted">No sales in this range.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <caption className="sr-only">Top products by {sort}</caption>
                <thead><tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-muted"><th scope="col" className="py-2 font-medium">Product</th><th scope="col" className="py-2 text-right font-medium">Units</th><th scope="col" className="py-2 text-right font-medium">Revenue</th></tr></thead>
                <tbody className="divide-y divide-stone-100">
                  {p.products.map((r) => (
                    <tr key={r.sku}><th scope="row" className="py-2 font-medium">{r.product}<span className="block text-xs font-normal text-muted">{r.variant} · {r.sku}</span></th><td className="py-2 text-right tabular-nums">{r.units}</td><td className="py-2 text-right tabular-nums">{r.revenue.formatted}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">Revenue is the items&apos; own price, before discount codes and delivery.</p>
        </section>

        <section className={card} aria-labelledby="disc-h">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="disc-h" className={heading}>Discount codes used</h2>
            <DownloadCsv filename={`discounts-${range.from}-to-${range.to}.csv`} rows={[["Code", "Name", "Uses", "Taken off (NGN)", "Delivery waived (NGN)", "Orders total (NGN)"], ...d.discounts.map((r) => [r.code, r.name, r.uses, naira(r.given.kobo), naira(r.delivery_waived.kobo), naira(r.revenue.kobo)])]} />
          </div>
          {d.discounts.length === 0 ? <p className="py-6 text-sm text-muted">No discount codes were used on paid orders in this range.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <caption className="sr-only">Discount codes used</caption>
                <thead><tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-muted"><th scope="col" className="py-2 font-medium">Code</th><th scope="col" className="py-2 text-right font-medium">Uses</th><th scope="col" className="py-2 text-right font-medium">Taken off</th><th scope="col" className="py-2 text-right font-medium">Orders total</th></tr></thead>
                <tbody className="divide-y divide-stone-100">
                  {d.discounts.map((r) => (
                    <tr key={r.id}><th scope="row" className="py-2 font-medium"><Link href={`/admin/discounts/${r.id}`} className="font-mono text-[13px] text-burgundy hover:underline">{r.code}</Link><span className="block text-xs font-normal text-muted">{r.name}</span></th><td className="py-2 text-right tabular-nums">{r.uses}</td><td className="py-2 text-right tabular-nums">{r.given.formatted}{r.delivery_waived.kobo > 0 && <span className="block text-xs text-muted">+ {r.delivery_waived.formatted} delivery</span>}</td><td className="py-2 text-right tabular-nums">{r.revenue.formatted}</td></tr>
                  ))}
                  <tr className="font-semibold"><th scope="row" className="py-2">All codes</th><td className="py-2 text-right tabular-nums">{d.totals.uses}</td><td className="py-2 text-right tabular-nums">{d.totals.given.formatted}</td><td className="py-2 text-right tabular-nums">{d.totals.revenue.formatted}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className={`${card} mt-6`} aria-labelledby="stock-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="stock-h" className={heading}>Low stock <span className="font-normal normal-case tracking-normal">(right now, not date-bound)</span></h2>
          <DownloadCsv filename="low-stock.csv" rows={[["SKU", "Product", "Variant", "Available", "On hand", "Held for unpaid orders", "Alert level"], ...st.variants.map((r) => [r.sku, r.product, r.variant, r.available, r.on_hand, r.reserved, r.threshold])]} />
        </div>
        <p className="mb-3 text-sm text-muted">{st.counts.low} of {st.counts.on_sale} items on sale are at or below their alert level; {st.counts.out_of_stock} are out of stock.</p>
        {st.variants.length === 0 ? <p className="py-4 text-sm text-muted">Nothing is running low.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">Items at or below their low-stock level, lowest first</caption>
              <thead><tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-muted"><th scope="col" className="py-2 font-medium">Item</th><th scope="col" className="py-2 text-right font-medium">Available</th><th scope="col" className="py-2 text-right font-medium">On hand</th><th scope="col" className="py-2 text-right font-medium">Held</th><th scope="col" className="py-2 text-right font-medium">Alert at</th></tr></thead>
              <tbody className="divide-y divide-stone-100">
                {st.variants.map((r) => (
                  <tr key={r.id}>
                    <th scope="row" className="py-2 font-medium">{canOpenProducts ? <Link href={`/admin/products/${r.product_id}`} className="text-burgundy hover:underline">{r.product}</Link> : r.product}<span className="block text-xs font-normal text-muted">{r.variant} · {r.sku}</span></th>
                    <td className={`py-2 text-right tabular-nums ${r.available <= 0 ? "font-semibold text-red-700" : ""}`}>{r.available}{r.available <= 0 && <span className="sr-only"> (out of stock)</span>}</td>
                    <td className="py-2 text-right tabular-nums">{r.on_hand}</td><td className="py-2 text-right tabular-nums">{r.reserved}</td><td className="py-2 text-right tabular-nums">{r.threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
