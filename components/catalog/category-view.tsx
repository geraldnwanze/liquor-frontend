import Link from "next/link";
import { Suspense } from "react";
import { getProducts } from "@/lib/api/catalog";
import type { Category } from "@/lib/api/types";
import { parseListingParams } from "@/lib/listing-params";
import { absoluteUrl } from "@/lib/seo";
import { Breadcrumbs, breadcrumbJsonLd, type Crumb } from "./breadcrumbs";
import { JsonLd } from "./json-ld";
import { Pagination } from "./pagination";
import { ProductCard } from "./product-card";
import { ProductFilters } from "./product-filters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Shared by /[category] and /[category]/[sub]. The heading and sub-category links render before the product grid streams. */
export function CategoryView({ category, trail, basePath, searchParams }: { category: Category; trail: Crumb[]; basePath: string; searchParams: SearchParams }) {
  const children = category.children ?? [];
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <JsonLd data={breadcrumbJsonLd(trail, absoluteUrl)} />
      <Breadcrumbs trail={trail} />
      <header className="relative mt-4 overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-br from-[#2a1b17] via-[#1a1210] to-[#120c0a] px-6 py-8 sm:px-10 sm:py-12">
        <span aria-hidden="true" className="absolute -right-10 -top-16 size-64 rounded-full bg-burgundy/30 blur-3xl" />
        <p className="relative text-xs font-medium uppercase tracking-[0.28em] text-gold">Collection</p>
        <h1 className="relative mt-2 text-4xl text-ivory sm:text-5xl">{category.name}</h1>
        {category.description && <p className="relative mt-3 max-w-2xl text-pretty leading-relaxed text-ivory/70">{category.description}</p>}
      </header>

      {children.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label={`${category.name} categories`}>
          {children.map((child) => (
            <li key={child.slug}>
              <Link href={`${basePath}/${child.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-gold/25 bg-white px-5 text-sm transition hover:border-gold hover:text-accent">
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Suspense fallback={<ListingSkeleton />}>
        <Listing categorySlug={category.slug} basePath={basePath} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

export async function Listing({ categorySlug, basePath, searchParams, searchLabel }: { categorySlug?: string; basePath: string; searchParams: SearchParams; searchLabel?: string }) {
  const { query, form, linkParams } = parseListingParams(await searchParams);
  const result = await getProducts(categorySlug ? { ...query, category: categorySlug } : query);

  return (
    <section className="mt-8" aria-labelledby="results-heading">
      <ProductFilters basePath={basePath} values={form} searchLabel={searchLabel} />
      <h2 id="results-heading" className="mt-6 !font-sans text-sm !font-normal tracking-normal text-muted" role="status">
        {result.meta.total} {result.meta.total === 1 ? "product" : "products"}
      </h2>

      {result.data.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gold/30 p-10 text-center">
          <p className="font-medium">No products match your filters.</p>
          <p className="mt-1 text-sm text-muted">Try a different search, widen the price range, or clear the filters.</p>
          <Link href={basePath} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">
            Clear filters
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {result.data.map((product, i) => (
            <li key={product.slug}>
              <ProductCard product={product} priority={i < 4} />
            </li>
          ))}
        </ul>
      )}

      <Pagination basePath={basePath} params={linkParams} current={result.meta.current_page} last={result.meta.last_page} />
    </section>
  );
}

export function ListingSkeleton() {
  return (
    <div className="mt-8" aria-hidden="true">
      <div className="h-16 animate-pulse rounded-2xl bg-white sm:h-24" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-gold/10 bg-white">
            <div className="aspect-[4/5] animate-pulse bg-white/5" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-1/4 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
