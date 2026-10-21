const TONES = {
  green: "bg-emerald-100 text-emerald-900",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-900",
  blue: "bg-sky-100 text-sky-900",
  grey: "bg-stone-200 text-stone-700",
} as const;

type Tone = keyof typeof TONES;

const ORDER: Record<string, [string, Tone]> = {
  pending_payment: ["Awaiting payment", "amber"],
  paid: ["Paid", "green"],
  cancelled: ["Cancelled", "grey"],
  expired: ["Expired", "grey"],
};
const PAYMENT: Record<string, [string, Tone]> = {
  pending: ["Unpaid", "amber"],
  paid: ["Paid", "green"],
  failed: ["Failed", "red"],
  partially_refunded: ["Part refunded", "blue"],
  refunded: ["Refunded", "grey"],
};
const FULFILMENT: Record<string, [string, Tone]> = {
  unfulfilled: ["To prepare", "amber"],
  processing: ["Preparing", "blue"],
  out_for_delivery: ["Out for delivery", "blue"],
  delivered: ["Delivered", "green"],
  delivery_failed: ["Delivery failed", "red"],
};
const PAYMENT_STATE: Record<string, [string, Tone]> = {
  pending: ["Pending", "amber"],
  succeeded: ["Succeeded", "green"],
  failed: ["Failed", "red"],
  abandoned: ["Abandoned", "grey"],
  review: ["Needs review", "red"],
};

const PRODUCT: Record<string, [string, Tone]> = {
  draft: ["Draft", "amber"],
  active: ["Active", "green"],
  archived: ["Archived", "grey"],
  discontinued: ["Discontinued", "red"],
};

const DISCOUNT: Record<string, [string, Tone]> = {
  active: ["Active", "green"],
  scheduled: ["Scheduled", "blue"],
  expired: ["Expired", "grey"],
  disabled: ["Switched off", "amber"],
};

const MAPS = { discount: DISCOUNT, product: PRODUCT, order: ORDER, payment: PAYMENT, fulfilment: FULFILMENT, paymentState: PAYMENT_STATE } as const;

/** A small coloured pill. The text always says the status, so colour is never the only signal. */
export function StatusBadge({ kind, value, label }: { kind: keyof typeof MAPS; value: string; label?: string }) {
  const [text, tone] = MAPS[kind][value] ?? [value.replaceAll("_", " "), "grey" as Tone];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>{label ?? text}</span>;
}
