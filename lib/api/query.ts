export type Query = Record<string, string | number | boolean | undefined>;

/**
 * Builds the query string for the Laravel API. Booleans are sent as 1/0 because Laravel's `boolean` rule rejects
 * "true"/"false" strings. Empty values are omitted.
 */
export function applyQuery(url: URL, query: Query): URL {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  }
  return url;
}
