"use client";

import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "@/lib/pwa/use-online-status";

/** Tells the customer, plainly, when the device is offline and what that means. */
export function ConnectivityBanner() {
  const online = useOnlineStatus();
  const wasOffline = useRef(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    const show = setTimeout(() => setReconnected(true), 0);
    const hide = setTimeout(() => setReconnected(false), 4000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [online]);

  if (online && !reconnected) return null;

  return (
    <div
      role="status"
      className={`px-4 py-2 text-center text-sm ${online ? "bg-emerald-800 text-white" : "bg-midnight text-ivory"}`}
    >
      {online
        ? "Back online."
        : "You're offline. Saved pages still open, but prices and stock may be out of date, and checkout isn't available."}
    </div>
  );
}
