import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Listing, ListingSkeleton } from "@/components/catalog/category-view";

// Search results are never indexed: they are unbounded URLs, and the category pages are the canonical listings.
export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <Breadcrumbs trail={[{ name: "Home", href: "/" }, { name: "All products", href: "/search" }]} />
      <header className="mt-4">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">The full collection</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">All products</h1>
      </header>
      <Suspense fallback={<ListingSkeleton />}>
        <Listing basePath="/search" searchParams={searchParams} searchLabel="Search all products" />
      </Suspense>
    </div>
  );
}
