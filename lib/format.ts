const dateTime = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });
const dateOnly = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" });

/** Dates are shown in Nigerian time (Africa/Lagos), whatever the visitor's or server's own time zone is. */
export function formatDateTime(iso: string | null | undefined): string {
  return iso ? dateTime.format(new Date(iso)) : "";
}

export function formatDate(iso: string | null | undefined): string {
  return iso ? dateOnly.format(new Date(iso)) : "";
}

/**
 * Naira typed by staff (e.g. "1,500", "1500.5") -> integer kobo, with no floating point. Returns null for anything
 * that is not a plain amount with at most two decimals.
 */
export function nairaToKobo(input: string): number | null {
  const text = input.replace(/[,\s₦]/g, "");
  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(text);
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
}

/** Integer kobo -> the plain naira text shown in an edit box ("15000", "15000.5" becomes "15000.50"). No floats. */
export function koboToNairaInput(kobo: number | null | undefined): string {
  if (kobo === null || kobo === undefined) return "";
  const naira = Math.trunc(kobo / 100);
  const rest = kobo % 100;
  return rest === 0 ? String(naira) : `${naira}.${String(rest).padStart(2, "0")}`;
}
