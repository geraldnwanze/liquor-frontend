import type { Cart } from "@/lib/api/types";

export const EMPTY_CART: Cart = {
  token: null,
  items: [],
  item_count: 0,
  subtotal: { kobo: 0, formatted: "₦0", currency: "NGN" },
  has_issues: false,
  discount: null,
  delivery: null,
};
