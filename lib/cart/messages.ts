import type { Cart, CartIssue } from "@/lib/api/types";

const ISSUE_TEXT: Record<CartIssue, string> = {
  unavailable: "No longer available. Remove it to continue.",
  out_of_stock: "Out of stock. Remove it to continue.",
  insufficient_stock: "Not enough in stock for this quantity.",
  over_line_limit: "Above the maximum quantity per order for this item.",
};

export function issueMessage(issue: CartIssue): string {
  return ISSUE_TEXT[issue];
}

/** Checkout needs a connection, a non-empty cart and no unresolved line problems. Returns why not, or null. */
export function checkoutBlocker(cart: Cart | null, online: boolean): string | null {
  if (!online) return "You're offline. Checkout needs an internet connection to confirm stock, prices and delivery.";
  if (!cart || cart.items.length === 0) return "Your cart is empty.";
  if (cart.has_issues) return "Some items need your attention before you can check out.";
  return null;
}
