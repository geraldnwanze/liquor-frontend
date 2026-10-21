import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategories } from "@/lib/api/catalog";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, slugs] = await Promise.all([getCategories(), getAllProductSlugs()]);

  const categoryUrls = categories.flatMap((root) => [
    { url: absoluteUrl(`/${root.slug}`), changeFrequency: "daily" as const, priority: 0.8 },
    ...(root.children ?? []).map((child) => ({ url: absoluteUrl(`/${root.slug}/${child.slug}`), changeFrequency: "daily" as const, priority: 0.7 })),
  ]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    ...categoryUrls,
    ...slugs.map((slug) => ({ url: absoluteUrl(`/products/${slug}`), changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}
