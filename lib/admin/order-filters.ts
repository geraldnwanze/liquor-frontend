type Raw = Record<string, string | string[] | undefined>;

const STATUS = ["pending_payment", "paid", "cancelled", "expired"];
const PAYMENT = ["pending", "paid", "failed", "partially_refunded", "refunded"];
const FULFILMENT = ["unfulfilled", "processing", "out_for_delivery", "delivered", "delivery_failed"];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));
const oneOf = (v: string, allowed: string[]) => (allowed.includes(v) ? v : "");
const isoDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : "");

export interface AdminOrderFilters {
  q: string;
  status: string;
  payment_status: string;
  fulfilment_status: string;
  from: string;
  to: string;
  page: number;
}

/** Reads the filter box state from the URL. Anything unexpected is dropped, never forwarded to the API. */
export function parseAdminOrderFilters(raw: Raw): AdminOrderFilters {
  const page = Number(first(raw.page));
  return {
    q: first(raw.q).trim().slice(0, 100),
    status: oneOf(first(raw.status), STATUS),
    payment_status: oneOf(first(raw.payment_status), PAYMENT),
    fulfilment_status: oneOf(first(raw.fulfilment_status), FULFILMENT),
    from: isoDate(first(raw.from)),
    to: isoDate(first(raw.to)),
    page: Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1,
  };
}

/** The filters that should survive a page change (everything except `page`). */
export function filterParams(f: AdminOrderFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of ["q", "status", "payment_status", "fulfilment_status", "from", "to"] as const) {
    if (f[key]) out[key] = f[key];
  }
  return out;
}
