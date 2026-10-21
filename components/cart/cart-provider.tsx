"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addToCartAction, applyDiscountAction, fetchCartAction, removeCartItemAction, removeDiscountAction, updateCartItemAction } from "@/app/actions/cart";
import { networkError, type CartResult } from "@/lib/api/result";
import type { Cart } from "@/lib/api/types";
import { EMPTY_CART } from "@/lib/cart/empty";
import { onSessionChange } from "@/lib/auth/session-events";
import { clearCartSnapshot, loadCartSnapshot, saveCartSnapshot } from "@/lib/cart/snapshot";
import { useOnlineStatus } from "@/lib/pwa/use-online-status";
import { CartDrawer } from "./cart-drawer";

interface CartContextValue {
  cart: Cart;
  /** True until the first cart fetch has finished (only when the browser has a cart cookie). */
  loading: boolean;
  /** The server could not be reached, so `cart` is the last saved copy and may be out of date. */
  stale: boolean;
  online: boolean;
  /** Item id with a request in flight (the UI disables just that line). */
  busyItemId: string | "add" | "discount" | null;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (variantId: string, quantity: number) => Promise<CartResult>;
  setQuantity: (itemId: string, quantity: number) => Promise<CartResult>;
  remove: (itemId: string) => Promise<CartResult>;
  applyCode: (code: string, delivery?: { state: string; city: string }) => Promise<CartResult>;
  removeCode: (delivery?: { state: string; city: string }) => Promise<CartResult>;
  refresh: (delivery?: { state: string; city: string }) => Promise<CartResult>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

const hasCartCookie = () => document.cookie.split("; ").includes("lq_has_cart=1");

// Failures that mean "your cart changed under you": refetch so the screen shows the truth.
const RESYNC_CODES = new Set(["insufficient_stock", "variant_unavailable", "quantity_limit", "cart_has_issues"]);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inFlight = useRef(false);

  const apply = useCallback((result: CartResult): CartResult => {
    if (result.ok) {
      setCart(result.cart);
      setStale(false);
      saveCartSnapshot(result.cart);
    }
    return result;
  }, []);

  const refresh = useCallback(
    async (delivery?: { state: string; city: string }): Promise<CartResult> => {
      let result: CartResult;
      try {
        result = await fetchCartAction(delivery);
      } catch {
        result = networkError();
      }
      if (!result.ok && result.code === "network") {
        // Keep showing the last known cart, clearly marked as saved rather than confirmed.
        setStale(true);
        return result;
      }
      return apply(result);
    },
    [apply],
  );

  // Restore on load: the cookie holds the real cart; the snapshot only fills the gap if the server is unreachable.
  useEffect(() => {
    if (!hasCartCookie()) return;
    let active = true;
    const snapshot = loadCartSnapshot();
    const start = setTimeout(() => {
      if (!active) return;
      if (snapshot) setCart(snapshot);
      setLoading(true);
      refresh().finally(() => active && setLoading(false));
    }, 0);
    return () => {
      active = false;
      clearTimeout(start);
    };
  }, [refresh]);

  // Signed in or out in this tab: drop whatever cart is on screen and load the one that belongs to the new session.
  useEffect(
    () =>
      onSessionChange(() => {
        setCart(EMPTY_CART);
        setStale(false);
        clearCartSnapshot();
        if (hasCartCookie()) void refresh();
      }),
    [refresh],
  );

  // Back online: revalidate prices, stock and availability before the customer relies on the saved copy.
  useEffect(() => {
    if (online && stale && hasCartCookie()) {
      const t = setTimeout(() => void refresh(), 0);
      return () => clearTimeout(t);
    }
  }, [online, stale, refresh]);

  const mutate = useCallback(
    async (busy: string, run: () => Promise<CartResult>): Promise<CartResult> => {
      if (!navigator.onLine) return networkError();
      if (inFlight.current) return { ok: false, code: "busy", message: "Please wait a moment." };
      inFlight.current = true;
      setBusyItemId(busy);
      try {
        let result: CartResult;
        try {
          result = await run();
        } catch {
          result = networkError();
        }
        if (!result.ok && RESYNC_CODES.has(result.code)) void refresh();
        return apply(result);
      } finally {
        inFlight.current = false;
        setBusyItemId(null);
      }
    },
    [apply, refresh],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      stale,
      online,
      busyItemId,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      add: (variantId, quantity) => mutate("add", () => addToCartAction(variantId, quantity)),
      setQuantity: (itemId, quantity) => mutate(itemId, () => updateCartItemAction(itemId, quantity)),
      remove: (itemId) => mutate(itemId, () => removeCartItemAction(itemId)),
      applyCode: (code, delivery) => mutate("discount", () => applyDiscountAction(code, delivery)),
      removeCode: (delivery) => mutate("discount", () => removeDiscountAction(delivery)),
      refresh,
    }),
    [cart, loading, stale, online, busyItemId, drawerOpen, mutate, refresh],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

/** Forgets the saved copy (e.g. after an order is placed and the cart is no longer the customer's to resume). */
export function forgetSavedCart(): void {
  clearCartSnapshot();
}
