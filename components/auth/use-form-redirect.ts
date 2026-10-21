import { useEffect } from "react";
import type { FormState } from "@/lib/auth/form-state";
import { announceSessionChange } from "@/lib/auth/session-events";

/**
 * After sign-in/registration/reset, navigate away and announce the session change so everything that depends on who
 * the customer is (header, cart) refreshes even if the browser performs an in-page navigation instead of a reload.
 */
export function useHardRedirect(state: FormState): void {
  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      // Tell the header and cart first (they refresh from the new cookies), then navigate.
      announceSessionChange();
      window.location.assign(state.redirectTo);
    }
  }, [state]);
}
