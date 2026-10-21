/** The search term as the API should see it: trimmed, single-spaced and capped. An empty box is not searched. */
export function normalizeQuery(raw: string | null | undefined): string | null {
  const q = (raw ?? "").replace(/\s+/g, " ").trim().slice(0, 100);
  return q.length >= 1 ? q : null;
}
