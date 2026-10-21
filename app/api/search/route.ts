import { apiGet } from "@/lib/api/client";
import type { Paginated, ProductListItem } from "@/lib/api/types";
import { normalizeQuery } from "@/lib/search/normalize";

export interface SearchSuggestion {
  slug: string;
  name: string;
  brand: string | null;
  image: { url: string; alt: string } | null;
  price: string | null;
  inStock: boolean;
}

/**
 * Live search suggestions for the header box. Read-only and public (the same data the shop pages show), a handful of
 * results per request. The browser debounces and cancels stale requests; the API's own limits still apply.
 */
export async function GET(request: Request) {
  const q = normalizeQuery(new URL(request.url).searchParams.get("q"));
  if (!q) return Response.json({ q: "", results: [], total: 0 });

  try {
    const res = await apiGet<Paginated<ProductListItem>>("/products", { q, per_page: 6 });
    const results: SearchSuggestion[] = (res?.data ?? []).map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand?.name ?? null,
      image: p.image ? { url: p.image.url, alt: p.image.alt || p.name } : null,
      price: p.price_from?.formatted ?? null,
      inStock: p.in_stock,
    }));
    return Response.json({ q, results, total: res?.meta.total ?? results.length }, { headers: { "Cache-Control": "private, max-age=20" } });
  } catch {
    return Response.json({ q, results: [], total: 0, error: true }, { status: 502 });
  }
}
