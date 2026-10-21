"use client";

import { useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import { forgetSavedCart } from "@/components/cart/cart-provider";
import { announceSessionChange } from "@/lib/auth/session-events";
import { clearUserData } from "@/lib/pwa/service-worker";

export function LogoutButton({ className }: { className?: string } = {}) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    // Forget everything this browser kept for the customer before the session ends.
    forgetSavedCart();
    try {
      sessionStorage.removeItem("lq:checkout-area");
    } catch {
      /* ignore */
    }
    await clearUserData();
    try {
      await logoutAction();
    } finally {
      announceSessionChange();
      // Deliberate full page load (not a client transition): nothing from the signed-in session survives in memory.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    }
  }

  return (
    <button type="button" onClick={signOut} disabled={pending} className={className ?? "min-h-11 rounded-full border border-burgundy px-4 text-sm font-medium text-accent disabled:opacity-60"}>
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
