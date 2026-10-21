import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminProduct } from "@/lib/api/types";
import { parseAdminProductFilters, productFilterParams } from "@/lib/admin/product-filters";
import { formatNaira } from "@/lib/money";
import { ProductRowDelete } from "@/components/admin/product-row-delete";
import { LiveQueryInput } from "@/components/admin/live-query-input";

export const metadata: Metadata = { title: "Products" };

const TABS = [
  { label: "All", status: "" },
  { label: "Active", status: "active" },
  { label: "Draft", status: "draft" },
  { label: "Archived", status: "archived" },
  { label: "Discontinued", status: "discontinued" },
];
const control = "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-ink";

export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  await requireStaff("/admin/products", "catalog.manage");
  const f = parseAdminProductFilters(await searchParams);
  const params = productFilterParams(f);
  const [list, cats] = await Promise.all([
    adminGet<{ data: AdminProduct[]; meta: { current_page: number; last_page: number; total: number } }>("/products", { ...params, page: f.page }),
    adminGet<{ data: { id: string; name: string; parent_id: string | null }[] }>("/categories"),
  ]);
  if (!list.data) return <p role="alert">Products could not be loaded.</p>;
  const { data: products, meta } = list.data;
  const link = (extra: Record<string, string>) => `/admin/products?${new URLSearchParams({ ...params, ...extra })}`;

  return (
    <>
      <PageHeader title="Products" subtitle={`${meta.total} product${meta.total === 1 ? "" : "s"}`}>
        <Link href="/admin/products/new" className="inline-flex h-10 items-center rounded-lg bg-burgundy px-5 text-sm font-semibold text-ivory hover:bg-burgundy-deep">New product</Link>
      </PageHeader>

      <nav aria-label="Status" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const active = f.status === t.status;
          const href = t.status ? link({ status: t.status }) : `/admin/products?${new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([k]) => k !== "status")))}`;
          return (
            <Link key={t.label} href={href} aria-current={active ? "page" : undefined}
              className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium ${active ? "border-burgundy bg-burgundy text-ivory" : "border-stone-300 bg-white hover:bg-stone-50"}`}>
              {t.label}
            </Link>
          );
        })}
      </nav>

      <form method="get" role="search" aria-label="Search products" className={`${panel} mb-5 flex flex-wrap items-end gap-3 p-4`}>
        {f.status && <input type="hidden" name="status" value={f.status} />}
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-medium text-muted">Search
          <LiveQueryInput defaultValue={f.q} placeholder="Name or SKU" className={control} />
        </label>
        <label className="flex w-full flex-col gap-1 text-xs font-medium text-muted sm:w-56">Category
          <select name="category_id" defaultValue={f.category_id} className={control}>
            <option value="">All categories</option>
            {(cats.data?.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.parent_id ? "— " : ""}{c.name}</option>)}
          </select>
        </label>
        <button className="h-10 rounded-lg bg-burgundy px-6 text-sm font-semibold text-ivory hover:bg-burgundy-deep">Search</button>
      </form>

      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Products, newest first</caption>
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="px-3 py-3 font-medium">Product</th>
              <th scope="col" className="px-3 py-3 font-medium">Category</th>
              <th scope="col" className="px-3 py-3 font-medium">Status</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Variants</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Available</th>
              <th scope="col" className="px-3 py-3 text-right font-medium">Price</th>
              <th scope="col" className="px-3 py-3 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map((p) => {
              const variants = p.variants ?? [];
              const prices = variants.map((v) => v.price_kobo);
              const available = variants.reduce((n, v) => n + v.available, 0);
              const low = variants.some((v) => v.is_active && v.available <= v.low_stock_threshold);
              return (
                <tr key={p.id} className="hover:bg-stone-50">
                  <th scope="row" className="px-3 py-3 font-medium">
                    <Link href={`/admin/products/${p.id}`} className="text-burgundy hover:underline">{p.name}</Link>
                    {p.is_demo && <span className="ml-2 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-normal text-muted">demo</span>}
                    <span className="block text-xs font-normal text-muted">{p.brand?.name ?? "No brand"}</span>
                  </th>
                  <td className="px-3 py-3 text-muted">{p.category?.name ?? "-"}</td>
                  <td className="px-3 py-3"><StatusBadge kind="product" value={p.status} /></td>
                  <td className="px-3 py-3 text-right tabular-nums">{variants.length}</td>
                  <td className={`px-3 py-3 text-right tabular-nums ${low ? "font-semibold text-red-700" : ""}`}>{available}{low && <span className="sr-only"> (low stock)</span>}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                    {prices.length === 0 ? "-" : Math.min(...prices) === Math.max(...prices) ? formatNaira(prices[0]) : `${formatNaira(Math.min(...prices))} - ${formatNaira(Math.max(...prices))}`}
                  </td>
                  <td className="px-3 py-3"><ProductRowDelete id={p.id} name={p.name} status={p.status} /></td>
                </tr>
              );
            })}
            {products.length === 0 && <tr><td colSpan={7} className="px-3 py-12 text-center text-muted">No products match.</td></tr>}
          </tbody>
        </table>
      </div>
      {meta.last_page > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Page {meta.current_page} of {meta.last_page}</span>
          <span className="flex gap-2">
            {meta.current_page > 1 && <Link href={link({ page: String(meta.current_page - 1) })} className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium">Previous</Link>}
            {meta.current_page < meta.last_page && <Link href={link({ page: String(meta.current_page + 1) })} className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium">Next</Link>}
          </span>
        </nav>
      )}
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
