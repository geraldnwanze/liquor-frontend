import type { ProductQuery } from "./api/types";

type Raw = Record<string, string | string[] | undefined>;

const SORTS = ["newest", "price_asc", "price_desc", "name"] as const;

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

function wholeNumber(v: string, max: number): number | undefined {
  if (!/^\d{1,12}$/.test(v)) return undefined;
  const n = Number(v);
  return n <= max ? n : undefined;
}

export interface ListingParams {
  /** Validated query for the API. Anything malformed in the URL is dropped, never forwarded. */
  query: ProductQuery;
  /** Raw-ish values to prefill the filter form. */
  form: { q: string; sort: string; min_price: string; max_price: string; in_stock: boolean };
  /** Params to preserve in pagination links (everything except page). */
  linkParams: Record<string, string>;
}

export function parseListingParams(raw: Raw): ListingParams {
  const q = first(raw.q).trim().slice(0, 100);
  const sortRaw = first(raw.sort);
  const sort = (SORTS as readonly string[]).includes(sortRaw) ? (sortRaw as ProductQuery["sort"]) : undefined;
  const min = wholeNumber(first(raw.min_price), 1_000_000_000);
  const max = wholeNumber(first(raw.max_price), 1_000_000_000);
  const inStock = first(raw.in_stock) === "1";
  const page = wholeNumber(first(raw.page), 1000);

  const query: ProductQuery = { per_page: 24 };
  if (q) query.q = q;
  if (sort && sort !== "newest") query.sort = sort;
  if (min !== undefined) query.min_price = min;
  if (max !== undefined) query.max_price = max;
  if (inStock) query.in_stock = true;
  if (page && page > 1) query.page = page;

  const linkParams: Record<string, string> = {};
  if (q) linkParams.q = q;
  if (query.sort) linkParams.sort = query.sort;
  if (min !== undefined) linkParams.min_price = String(min);
  if (max !== undefined) linkParams.max_price = String(max);
  if (inStock) linkParams.in_stock = "1";

  return {
    query,
    form: { q, sort: query.sort ?? "newest", min_price: min === undefined ? "" : String(min), max_price: max === undefined ? "" : String(max), in_stock: inStock },
    linkParams,
  };
}
