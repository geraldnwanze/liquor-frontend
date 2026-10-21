import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView } from "@/components/catalog/category-view";
import { getCategories, getCategory } from "@/lib/api/catalog";

// Blocking route by design: the slug is validated before any HTML is sent, so unknown URLs get a real 404
// (this relies on partialPrefetching being off; see next.config.ts).
export const instant = false;

export async function generateStaticParams() {
  const roots = await getCategories();
  const params = roots.flatMap((root) => (root.children ?? []).map((child) => ({ category: root.slug, sub: child.slug })));
  return params.length ? params : [{ category: "__placeholder__", sub: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/[category]/[sub]">): Promise<Metadata> {
  const { category: parentSlug, sub } = await params;
  const category = await getCategory(sub);
  if (!category || category.parent?.slug !== parentSlug) return { title: "Category not found", robots: { index: false } };

  const path = `/${parentSlug}/${category.slug}`;
  return {
    title: category.seo.title,
    description: category.seo.description ?? undefined,
    alternates: { canonical: path },
    openGraph: { title: category.seo.title, description: category.seo.description ?? undefined, url: path, type: "website" },
  };
}

export default async function SubCategoryPage({ params, searchParams }: PageProps<"/[category]/[sub]">) {
  const { category: parentSlug, sub } = await params;
  const category = await getCategory(sub);
  // The URL must match the real hierarchy, otherwise /wine/whiskey would duplicate /spirits/whiskey.
  if (!category || category.parent?.slug !== parentSlug) notFound();

  const parent = category.parent!;
  const basePath = `/${parent.slug}/${category.slug}`;
  return (
    <CategoryView
      category={category}
      basePath={basePath}
      trail={[{ name: "Home", href: "/" }, { name: parent.name, href: `/${parent.slug}` }, { name: category.name, href: basePath }]}
      searchParams={searchParams}
    />
  );
}
