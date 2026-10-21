import type { Cart } from "@/lib/api/types";

/**
 * A convenience copy of the last cart the server sent, so an offline customer can still *see* their cart.
 * It is never authoritative: when shown it is labelled as saved, mutations and checkout are disabled, and the real
 * cart is re-fetched (re-priced, stock re-checked) as soon as the connection returns. Holds no personal data.
 */
const KEY = "lq:cart-snapshot";

export function saveCartSnapshot(cart: Cart): void {
  try {
    if (cart.items.length === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    /* storage unavailable: offline view is simply not available */
  }
}

export function loadCartSnapshot(): Cart | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cart;
    return Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearCartSnapshot(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
