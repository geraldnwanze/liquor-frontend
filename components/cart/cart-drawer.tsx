"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { checkoutBlocker } from "@/lib/cart/messages";
import { CartLine } from "./cart-line";
import { DiscountBox } from "./discount-box";
import { useCart } from "./cart-provider";

/** Right-hand cart panel built on a native modal <dialog>: focus trap, Esc to close and focus restore come free. */
export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, loading, stale, online } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) dialog.showModal();
    if (!drawerOpen && dialog.open) dialog.close();
  }, [drawerOpen]);

  const blocker = checkoutBlocker(cart, online && !stale);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={closeDrawer}
      // A click on the backdrop lands on the <dialog> element itself, never on its content.
      onClick={(e) => e.target === ref.current && closeDrawer()}
      className="fixed inset-y-0 right-0 m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-white p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-burgundy/15 px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold text-accent">
            Your cart{cart.item_count > 0 && <span className="ml-2 text-sm font-normal text-muted">({cart.item_count})</span>}
          </h2>
          <button onClick={closeDrawer} aria-label="Close cart" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-burgundy/5">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {stale && (
          <p role="status" className="bg-gold/20 px-4 py-2 text-sm">
            {online ? "Updating your cart…" : "You're offline. This is your last saved cart. We'll recheck prices and stock when you're back online."}
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-4">
          {loading && cart.items.length === 0 ? (
            <p className="py-10 text-center text-muted" role="status">
              Loading your cart…
            </p>
          ) : cart.items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium">Your cart is empty</p>
              <button onClick={closeDrawer} className="mt-4 min-h-11 rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-burgundy/10">
              {cart.items.map((item) => (
                <CartLine key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>

        {cart.items.length > 0 && (
          <footer className="space-y-3 border-t border-burgundy/15 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <DiscountBox />
            <p className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>{cart.subtotal.formatted}</span>
            </p>
            {cart.discount?.applied && cart.discount.amount.kobo > 0 && (
              <p className="flex justify-between text-sm">
                <span>Discount ({cart.discount.code})</span>
                <span>-{cart.discount.amount.formatted}</span>
              </p>
            )}
            <p className="text-xs text-muted">
              Delivery is calculated at checkout{cart.discount?.free_delivery ? ", where your free delivery code takes it off" : ""}. Prices, discounts and stock are confirmed when you place your order.
            </p>
            {blocker && (
              <p role="status" className="text-sm text-danger">
                {blocker}
              </p>
            )}
            {blocker ? (
              <span aria-disabled="true" className="flex min-h-12 items-center justify-center rounded-full bg-gold/40 px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">
                Checkout
              </span>
            ) : (
              <Link href="/checkout" onClick={closeDrawer} className="flex min-h-12 items-center justify-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">
                Checkout
              </Link>
            )}
          </footer>
        )}
      </div>
    </dialog>
  );
}
