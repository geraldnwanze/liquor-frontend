/** Formats integer kobo as naira, matching the Laravel API's formatting. Integer arithmetic only. */
export function formatNaira(kobo: number): string {
  const naira = Math.trunc(kobo / 100);
  const rest = kobo % 100;
  const base = `₦${naira.toLocaleString("en-NG")}`;
  return rest === 0 ? base : `${base}.${String(rest).padStart(2, "0")}`;
}

/** ₦1.2M, ₦850K, ₦900: short labels for chart axes. Rounded for display only; never used for arithmetic. */
export function formatNairaCompact(kobo: number): string {
  const naira = Math.round(kobo / 100);
  if (naira >= 1_000_000) return `₦${trimZero((naira / 1_000_000).toFixed(1))}M`;
  if (naira >= 1_000) return `₦${trimZero((naira / 1_000).toFixed(naira >= 100_000 ? 0 : 1))}K`;
  return `₦${naira}`;
}

const trimZero = (s: string) => s.replace(/\.0$/, "");
