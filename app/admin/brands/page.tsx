import type { Metadata } from "next";
import { BrandEditor } from "@/components/admin/brand-editor";
import { BrandForm } from "@/components/admin/brand-form";
import { LiveFilter } from "@/components/admin/live-filter";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminBrand } from "@/lib/api/types";

export const metadata: Metadata = { title: "Brands" };

export default async function AdminBrands() {
  await requireStaff("/admin/brands", "catalog.manage");
  const { data } = await adminGet<{ data: AdminBrand[] }>("/brands");
  if (!data) return <p role="alert">Brands could not be loaded.</p>;

  return (
    <>
      <PageHeader title="Brands" subtitle="The makers behind your products. A product can be given a brand on its edit page." />

      <section className={`${panel} mb-6 p-5`} aria-labelledby="new-brand">
        <h2 id="new-brand" className="mb-3 text-lg font-semibold">New brand</h2>
        <BrandForm />
      </section>

      <LiveFilter targetId="brand-list" label="Filter brands" placeholder="Filter by name, country or address" />
      <ul id="brand-list" className="space-y-3">
        {data.data.map((b) => (
          <li key={b.id} data-filter-item data-filter-text={`${b.name} ${b.slug} ${b.country ?? ""}`} className={`${panel} p-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{b.name}</h2>
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {b.country && <span>{b.country}</span>}
                <span>{b.products_count} {b.products_count === 1 ? "product" : "products"}</span>
                <span className={`rounded-full px-2 py-0.5 ${b.is_active ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-700"}`}>{b.is_active ? "Active" : "Inactive"}</span>
                {b.is_featured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">Featured</span>}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted">/{b.slug}</p>
            <BrandEditor brand={b} />
          </li>
        ))}
        {data.data.length === 0 && <li className={`${panel} p-8 text-center text-muted`}>No brands yet.</li>}
      </ul>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
