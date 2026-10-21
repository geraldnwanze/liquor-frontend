"use client";

import { useEffect, useState } from "react";
import { wasServedFromCache } from "@/lib/pwa/service-worker";
import { useOnlineStatus } from "@/lib/pwa/use-online-status";

/** Shown when this page load was answered from the service worker's saved copy rather than the live site. */
export function CachedNotice() {
  const [cached, setCached] = useState(false);
  const online = useOnlineStatus();

  useEffect(() => {
    let active = true;
    wasServedFromCache(window.location.href).then((hit) => active && setCached(hit));
    return () => {
      active = false;
    };
  }, []);

  if (!cached) return null;

  return (
    <div role="status" className="flex items-center justify-center gap-3 bg-gold/20 px-4 py-2 text-center text-sm text-ink">
      <span>This is a saved copy from your last visit. Prices, stock and offers may have changed.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        disabled={!online}
        className="min-h-9 rounded-full border border-burgundy px-3 font-medium text-accent disabled:opacity-50"
      >
        Refresh
      </button>
    </div>
  );
}
