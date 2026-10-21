import Link from "next/link";
import { LiveFilterForm } from "@/components/catalog/live-filter-form";
import { CollapsibleFilters } from "@/components/ui/collapsible-filters";

export interface FilterValues {
  q: string;
  sort: string;
  min_price: string;
  max_price: string;
  in_stock: boolean;
}

const field = "min-h-11 w-full rounded-lg border border-gold/25 bg-[#0f0b0a] px-3 text-ink";

/** A GET form that also updates the results live as you type (see LiveFilterForm). Shareable as a URL, and it works without JavaScript. */
export function ProductFilters({ basePath, values, searchLabel = "Search in this category" }: { basePath: string; values: FilterValues; searchLabel?: string }) {
  const active = values.q || values.min_price || values.max_price || values.in_stock || (values.sort && values.sort !== "newest");
  return (
    <CollapsibleFilters label={`Filters and sort${active ? " (on)" : ""}`} startOpen={Boolean(active)} buttonClassName="min-h-12 rounded-2xl border border-gold/15 bg-white px-4 text-sm font-medium">
    <LiveFilterForm basePath={basePath} className="grid gap-3 rounded-2xl border border-gold/15 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
      <label className="flex flex-col gap-1 text-sm lg:col-span-2">
        {searchLabel}
        <input type="search" name="q" defaultValue={values.q} maxLength={100} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Sort by
        <select name="sort" defaultValue={values.sort || "newest"} className={field}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Min price (₦)
        <input type="number" name="min_price" inputMode="numeric" min={0} defaultValue={values.min_price} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Max price (₦)
        <input type="number" name="max_price" inputMode="numeric" min={0} defaultValue={values.max_price} className={field} />
      </label>
      <div className="flex items-end gap-3">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="in_stock" value="1" defaultChecked={values.in_stock} className="size-5 accent-[#d6b36c]" />
          In stock only
        </label>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-6">
        <button className="min-h-11 rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">Apply</button>
        {active && (
          <Link href={basePath} className="min-h-11 content-center text-sm text-accent underline underline-offset-4">
            Clear filters
          </Link>
        )}
      </div>
    </LiveFilterForm>
    </CollapsibleFilters>
  );
}
