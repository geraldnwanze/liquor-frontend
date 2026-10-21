import { cacheLife, cacheTag } from "next/cache";
import { brand } from "@/lib/brand";
import { apiGet } from "./client";
import type { Category, DeliveryZone, PaymentGateway, Paginated, Product, ProductListItem, ProductQuery, PublicSettings, ReviewList, PublicPage, HomepageContent } from "./types";

/*
 * Catalogue reads. Lifetimes are deliberately short for anything containing price or stock: the page may be up to
 * ~1 minute behind the admin, but checkout always re-prices and re-checks stock on the server (never trust these).
 * Tags allow Laravel to trigger on-demand revalidation later.
 */

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("categories");
  const res = await apiGet<{ data: Category[] }>("/categories");
  return res?.data ?? [];
}

export async function getCategory(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("categories", `category:${slug}`);
  const res = await apiGet<{ data: Category }>(`/categories/${encodeURIComponent(slug)}`);
  return res?.data ?? null;
}

export async function getProducts(query: ProductQuery): Promise<Paginated<ProductListItem>> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag("products");
  const res = await apiGet<Paginated<ProductListItem>>("/products", { ...query });
  if (!res) throw new Error("Product listing returned 404");
  return res;
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag("products", `product:${slug}`);
  const res = await apiGet<{ data: Product }>(`/products/${encodeURIComponent(slug)}`);
  return res?.data ?? null;
}

/** Every published product slug (for the sitemap and static params). Pages through the API. */
export async function getAllProductSlugs(limit = Infinity): Promise<string[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("products");
  const slugs: string[] = [];
  for (let page = 1; slugs.length < limit; page++) {
    const res = await apiGet<Paginated<ProductListItem>>("/products", { page, per_page: 48 });
    if (!res) break;
    slugs.push(...res.data.map((p) => p.slug));
    if (page >= res.meta.last_page) break;
  }
  return slugs.slice(0, limit);
}

/** Where we deliver. Staff-managed, so cached briefly; checkout always re-validates on the server. */
export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("delivery");
  const res = await apiGet<{ data: DeliveryZone[] }>("/delivery/zones");
  return res?.data ?? [];
}

/** Storefront-safe commerce rules (minimum age, quantity limits). */
export async function getPublicSettings(): Promise<PublicSettings> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("settings");
  const res = await apiGet<{ data: PublicSettings }>("/settings/public");
  if (!res) throw new Error("Public settings endpoint returned 404");
  return res.data;
}

/** Payment methods currently open (enabled by staff and configured with credentials). Cached only briefly. */
export async function getPaymentGateways(): Promise<PaymentGateway[]> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag("payments");
  const res = await apiGet<{ data: PaymentGateway[] }>("/payments/gateways");
  return res?.data ?? [];
}

/** Best sellers of the last 90 days (empty until something has sold). */
export async function getBestSellers(limit = 8): Promise<ProductListItem[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("products");
  const res = await apiGet<{ data: ProductListItem[] }>("/products/best-sellers", { limit });
  return res?.data ?? [];
}

/** Approved reviews for one product. Short-lived: new approvals should show within a minute or so. */
export async function getReviews(slug: string, page = 1): Promise<ReviewList | null> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 600 });
  cacheTag("products", `reviews:${slug}`);
  return apiGet<ReviewList>(`/products/${encodeURIComponent(slug)}/reviews`, { page });
}

/** Published information pages linked from the footer. */
export async function getFooterPages(): Promise<{ title: string; slug: string }[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("pages");
  const res = await apiGet<{ data: { title: string; slug: string }[] }>("/pages");
  return res?.data ?? [];
}

export async function getPage(slug: string): Promise<PublicPage | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("pages", `page:${slug}`);
  const res = await apiGet<{ data: PublicPage }>(`/pages/${encodeURIComponent(slug)}`);
  return res?.data ?? null;
}

/**
 * The business name and logo for headers, footers and the admin. Never throws: if the settings can't be read the
 * site still renders with the built-in name and no logo.
 */
export async function getBranding(): Promise<{ name: string; logoUrl: string | null }> {
  try {
    const settings = await getPublicSettings();
    return { name: settings.business?.name || brand.name, logoUrl: settings.business?.logo_url ?? null };
  } catch {
    return { name: brand.name, logoUrl: null };
  }
}

const HOMEPAGE_DEFAULTS: HomepageContent = {
  announcement_text: null, announcement_link: null, hero_eyebrow: null, hero_title: null, hero_title_emphasis: null, hero_text: null,
  hero_primary_label: null, hero_primary_href: null, hero_secondary_label: null, hero_secondary_href: null, hero_image_url: null,
  show_best_sellers: true, show_new_arrivals: true, show_on_sale: true, show_how_it_works: true, show_promises: true,
};

/** What staff set for the front page and announcement strip. Never throws: the built-in wording is the fallback. */
export async function getHomepage(): Promise<HomepageContent> {
  try {
    return { ...HOMEPAGE_DEFAULTS, ...(await getPublicSettings()).homepage };
  } catch {
    return HOMEPAGE_DEFAULTS;
  }
}
