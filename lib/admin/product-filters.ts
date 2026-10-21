type Raw = Record<string, string | string[] | undefined>;

const STATUS = ["draft", "active", "archived", "discontinued"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

export interface AdminProductFilters {
  q: string;
  status: string;
  category_id: string;
  page: number;
}

/** Reads the product list filters from the URL; anything unexpected is dropped, never forwarded to the API. */
export function parseAdminProductFilters(raw: Raw): AdminProductFilters {
  const page = Number(first(raw.page));
  const category = first(raw.category_id);
  return {
    q: first(raw.q).trim().slice(0, 100),
    status: STATUS.includes(first(raw.status)) ? first(raw.status) : "",
    category_id: UUID.test(category) ? category : "",
    page: Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  };
}

export function productFilterParams(f: AdminProductFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of ["q", "status", "category_id"] as const) {
    if (f[key]) out[key] = f[key];
  }
  return out;
}
