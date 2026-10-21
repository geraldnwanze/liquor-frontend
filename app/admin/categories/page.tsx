import type { Metadata } from "next";
import { CategoryEditor } from "@/components/admin/category-editor";
import { CategoryForm } from "@/components/admin/category-form";
import { LiveFilter } from "@/components/admin/live-filter";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminCategory } from "@/lib/api/types";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategories() {
  await requireStaff("/admin/categories", "catalog.manage");
  const { data } = await adminGet<{ data: AdminCategory[] }>("/categories");
  if (!data) return <p role="alert">Categories could not be loaded.</p>;
  const all = data.data;
  const name = new Map(all.map((c) => [c.id, c.name]));
  // Top-level categories first, each followed by its sub-categories.
  const ordered = [...all.filter((c) => !c.parent_id), ...all.filter((c) => c.parent_id)].sort((a, b) => {
    const ra = a.parent_id ? (name.get(a.parent_id) ?? "") : a.name;
    const rb = b.parent_id ? (name.get(b.parent_id) ?? "") : b.name;
    return ra.localeCompare(rb) || Number(Boolean(a.parent_id)) - Number(Boolean(b.parent_id)) || a.sort_order - b.sort_order || a.name.localeCompare(b.name);
  });

  return (
    <>
      <PageHeader title="Categories" subtitle="The sections of the shop. Categories can sit inside other categories (for example Gin under Spirits)." />

      <section className={`${panel} mb-6 p-5`} aria-labelledby="new-category">
        <h2 id="new-category" className="mb-3 text-lg font-semibold">New category</h2>
        <CategoryForm all={all} />
      </section>

      <LiveFilter targetId="category-list" label="Filter categories" placeholder="Filter by name or address" />
      <ul id="category-list" className="space-y-3">
        {ordered.map((c) => (
          <li key={c.id} data-filter-item data-filter-text={`${c.name} ${c.slug} ${c.parent_id ? (name.get(c.parent_id) ?? "") : ""}`} className={`${panel} p-5 ${c.parent_id ? "ml-6 sm:ml-10" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{c.parent_id && <span aria-hidden="true" className="mr-1 text-muted">↳</span>}{c.name}</h2>
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {c.parent_id && <span>in {name.get(c.parent_id)}</span>}
                <span>{c.products_count} {c.products_count === 1 ? "product" : "products"}</span>
                <span className={`rounded-full px-2 py-0.5 ${c.is_active ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-700"}`}>{c.is_active ? "Visible" : "Hidden"}</span>
                {c.is_featured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">Featured</span>}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted">/{c.slug}</p>
            <CategoryEditor category={c} all={all} />
          </li>
        ))}
        {ordered.length === 0 && <li className={`${panel} p-8 text-center text-muted`}>No categories yet.</li>}
      </ul>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
