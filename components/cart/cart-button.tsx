"use client";

import { useCart } from "./cart-provider";

export function CartButton() {
  const { cart, openDrawer } = useCart();
  const count = cart.item_count;
  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={count > 0 ? `Open cart, ${count} ${count === 1 ? "item" : "items"}` : "Open cart"}
      className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 8h14l-1 12H6L5 8z" strokeLinejoin="round" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {count > 0 && (
        <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-midnight">
          {count}
        </span>
      )}
    </button>
  );
}
