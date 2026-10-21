import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CategoryView } from "@/components/catalog/category-view";
import { getCategories, getCategory } from "@/lib/api/catalog";

// Blocking route by design: the slug is validated before any HTML is sent, so unknown URLs get a real 404
// (this relies on partialPrefetching being off; see next.config.ts).
export const instant = false;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.length ? categories.map((c) => ({ category: c.slug })) : [{ category: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found", robots: { index: false } };

  const path = category.parent ? `/${category.parent.slug}/${category.slug}` : `/${category.slug}`;
  return {
    title: category.seo.title,
    description: category.seo.description ?? undefined,
    // Filters, sorting and pagination all canonicalise to the base category URL.
    alternates: { canonical: path },
    openGraph: { title: category.seo.title, description: category.seo.description ?? undefined, url: path, type: "website" },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[category]">) {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  // A sub-category has exactly one canonical URL: under its parent.
  if (category.parent) permanentRedirect(`/${category.parent.slug}/${category.slug}`);

  return <CategoryView category={category} basePath={`/${category.slug}`} trail={[{ name: "Home", href: "/" }, { name: category.name, href: `/${category.slug}` }]} searchParams={searchParams} />;
}
