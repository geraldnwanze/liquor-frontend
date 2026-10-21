import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminCustomerRow } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { LiveQueryInput } from "@/components/admin/live-query-input";

export const metadata: Metadata = { title: "Customers" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

export default async function AdminCustomers({ searchParams }: PageProps<"/admin/customers">) {
  await requireStaff("/admin/customers", "customers.manage");
  const raw = await searchParams;
  const q = first(raw.q).trim().slice(0, 100);
  const pageNo = Number(first(raw.page));
  const page = Number.isInteger(pageNo) && pageNo >= 1 && pageNo <= 1000 ? pageNo : 1;
  const status = first(raw.status) === "suspended" ? "suspended" : first(raw.status) === "active" ? "active" : "";
  const { data } = await adminGet<{ data: AdminCustomerRow[]; meta: { current_page: number; last_page: number; total: number } }>("/customers", { ...(q ? { q } : {}), ...(status ? { status } : {}), page });
  if (!data) return <p role="alert">Customers could not be loaded.</p>;
  const link = (p: number) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), page: String(p) })}`;
  const filterHref = (s: string) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), ...(s ? { status: s } : {}) })}`;

  return (
    <>
      <PageHeader title="Customers" subtitle={`${data.meta.total} customer${data.meta.total === 1 ? "" : "s"}${q ? " match your search" : ""}`} />

      <nav aria-label="Account status" className="mb-4 flex gap-2">
        {([["", "All"], ["active", "Active"], ["suspended", "Suspended"]] as const).map(([value, label]) => (
          <Link key={value} href={filterHref(value)} aria-current={status === value ? "page" : undefined} className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${status === value ? "bg-burgundy text-ivory" : "border border-stone-300 bg-white hover:bg-stone-50"}`}>{label}</Link>
        ))}
      </nav>

      <form method="get" role="search" aria-label="Search customers" className={`${panel} mb-5 flex flex-wrap items-end gap-3 p-4`}>
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-medium text-muted">Search
          <LiveQueryInput defaultValue={q} placeholder="Name, email or phone" className="h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-ink" />
        </label>
        <button className="h-10 rounded-lg bg-burgundy px-6 text-sm font-semibold text-ivory hover:bg-burgundy-deep">Search</button>
      </form>

      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Customers, newest first</caption>
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="px-3 py-3 font-medium">Customer</th>
              <th scope="col" className="px-3 py-3 font-medium">Phone</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Paid orders</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Spent</th>
              <th scope="col" className="px-3 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.data.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50">
                <th scope="row" className="px-3 py-3 font-medium">
                  <Link href={`/admin/customers/${c.id}`} className="text-burgundy hover:underline">{c.name}</Link>
                  {c.erased ? <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs font-normal text-stone-700">Erased</span> : !c.is_active && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-normal text-red-900">Suspended</span>}
                  <span className="block text-xs font-normal text-muted">{c.email}</span>
                </th>
                <td className="whitespace-nowrap px-3 py-3 text-muted">{c.phone ?? "-"}</td>
                <td className="px-3 py-3 text-right tabular-nums">{c.paid_orders}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{c.spent.formatted}</td>
                <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDate(c.joined_at)}</td>
              </tr>
            ))}
            {data.data.length === 0 && <tr><td colSpan={5} className="px-3 py-12 text-center text-muted">No customers found.</td></tr>}
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
