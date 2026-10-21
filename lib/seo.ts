import { brand } from "./brand";

export function absoluteUrl(path: string): string {
  return new URL(path, brand.siteUrl).toString();
}

/** Integer kobo -> "25000.00" without floating point (schema.org prices are decimal strings). */
export function koboToDecimal(kobo: number): string {
  const naira = Math.trunc(kobo / 100);
  const rest = String(kobo % 100).padStart(2, "0");
  return `${naira}.${rest}`;
}

/** Serialises structured data safely for an inline <script>: "<" is escaped so content can never close the tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
