import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminDiscount } from "@/lib/api/types";
import { describeDiscount } from "@/lib/admin/discount-format";
import { formatDate } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { LiveQueryInput } from "@/components/admin/live-query-input";

export const metadata: Metadata = { title: "Discounts" };

const STATUSES = ["active", "scheduled", "expired", "disabled"];
const TABS = [["", "All"], ["active", "Active"], ["scheduled", "Scheduled"], ["expired", "Expired"], ["disabled", "Switched off"]];
const control = "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm";
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

export default async function AdminDiscounts({ searchParams }: PageProps<"/admin/discounts">) {
  await requireStaff("/admin/discounts", "promotions.manage");
  const raw = await searchParams;
  const q = first(raw.q).trim().slice(0, 100);
  const status = STATUSES.includes(first(raw.status)) ? first(raw.status) : "";
  const params = { ...(q ? { q } : {}), ...(status ? { status } : {}) };
  const { data } = await adminGet<{ data: AdminDiscount[] }>("/discounts", params);
  if (!data) return <p role="alert">Discounts could not be loaded.</p>;

  return (
    <>
      <PageHeader title="Discounts" subtitle="Codes customers enter in the cart. One code can be used per order.">
        <Link href="/admin/discounts/new" className="inline-flex h-10 items-center rounded-lg bg-burgundy px-5 text-sm font-semibold text-ivory hover:bg-burgundy-deep">New discount</Link>
      </PageHeader>

      <nav aria-label="Status" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map(([value, label]) => (
          <Link key={label} href={value ? `/admin/discounts?${new URLSearchParams({ ...(q ? { q } : {}), status: value })}` : `/admin/discounts${q ? `?${new URLSearchParams({ q })}` : ""}`} aria-current={status === value ? "page" : undefined}
            className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${status === value ? "border-burgundy bg-burgundy text-ivory" : "border-stone-300 bg-white hover:bg-stone-50"}`}>
            {label}
          </Link>
        ))}
      </nav>

      <form method="get" role="search" aria-label="Search discounts" className={`${panel} mb-5 flex flex-wrap items-end gap-3 p-4`}>
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-medium text-muted">Search
          <LiveQueryInput defaultValue={q} placeholder="Code or name" className={control} />
        </label>
        <button className="h-10 rounded-lg bg-burgundy px-6 text-sm font-semibold text-ivory hover:bg-burgundy-deep">Search</button>
      </form>

      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Discount codes, newest first</caption>
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="px-3 py-3 font-medium">Code</th>
              <th scope="col" className="px-3 py-3 font-medium">What it does</th>
              <th scope="col" className="px-3 py-3 font-medium">Window</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Used</th>
              <th scope="col" className="px-3 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.data.map((d) => (
              <tr key={d.id} className="hover:bg-stone-50">
                <th scope="row" className="px-3 py-3 font-medium">
                  <Link href={`/admin/discounts/${d.id}`} className="font-mono text-[13px] text-burgundy hover:underline">{d.code}</Link>
                  <span className="block text-xs font-normal text-muted">{d.name}</span>
                </th>
                <td className="px-3 py-3">{describeDiscount(d, formatNaira)}<span className="block text-xs text-muted">{d.scope === "order" ? "Whole order" : d.scope === "products" ? "Chosen products" : "Chosen categories"}</span></td>
                <td className="whitespace-nowrap px-3 py-3 text-muted">{d.starts_at ? formatDate(d.starts_at) : "Now"} – {d.ends_at ? formatDate(d.ends_at) : "no end"}</td>
                <td className="px-3 py-3 text-right tabular-nums">{d.uses}{d.usage_limit ? ` / ${d.usage_limit}` : ""}</td>
                <td className="px-3 py-3"><StatusBadge kind="discount" value={d.status} /></td>
              </tr>
            ))}
            {data.data.length === 0 && <tr><td colSpan={5} className="px-3 py-12 text-center text-muted">No discounts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
