import type { AdminDiscount } from "@/lib/api/types";

type Summarisable = Pick<AdminDiscount, "type" | "percent" | "amount_kobo" | "max_discount_kobo" | "min_order_kobo">;

/** One line staff can read at a glance: "10% off, up to ₦5,000, from ₦10,000". */
export function describeDiscount(d: Summarisable, money: (kobo: number) => string): string {
  const parts: string[] = [];
  if (d.type === "percentage") {
    parts.push(`${d.percent}% off`);
    if (d.max_discount_kobo) parts.push(`up to ${money(d.max_discount_kobo)}`);
  } else if (d.type === "fixed") {
    parts.push(`${money(d.amount_kobo ?? 0)} off`);
  } else {
    parts.push("Free delivery");
  }
  if (d.min_order_kobo) parts.push(`from ${money(d.min_order_kobo)}`);
  return parts.join(", ");
}

const NIGERIA_OFFSET = "+01:00"; // Africa/Lagos has no daylight saving

/** A `datetime-local` value typed by staff (Nigerian time) -> an ISO timestamp with the right offset. "" is null. */
export function lagosInputToIso(value: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/.exec(value.trim());
  return m ? `${m[1]}T${m[2]}:00${NIGERIA_OFFSET}` : null;
}

const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** An ISO timestamp -> the Nigerian-time text a `datetime-local` box expects. */
export function isoToLagosInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const get = Object.fromEntries(parts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return `${get.year}-${get.month}-${get.day}T${get.hour}:${get.minute}`;
}
