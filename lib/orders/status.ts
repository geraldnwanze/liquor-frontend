import type { Order } from "@/lib/api/types";

const LABELS: Record<Order["status"], string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function orderStatusLabel(status: Order["status"]): string {
  return LABELS[status] ?? status;
}

/** Tailwind classes for a status chip. Colour is never the only signal: the label is always shown too. */
export function orderStatusTone(status: Order["status"]): string {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-900";
    case "pending_payment":
      return "bg-gold/25 text-ink";
    default:
      return "bg-burgundy/10 text-burgundy";
  }
}
