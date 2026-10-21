"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { announceSessionChange, onSessionChange } from "@/lib/auth/session-events";

const signedInFlag = () => document.cookie.split("; ").includes("lq_has_session=1");

/**
 * "Account" or "Sign in", decided in the browser from a non-secret flag cookie. The header is part of every page,
 * including the ones the service worker saves for offline use, so it must be identical for everyone: the server
 * never renders who the visitor is into shared HTML.
 *
 * It also acts as the session watcher. Sign-in can complete through an in-page, server-driven redirect that never
 * runs a form's own success handler, so whenever the route changes this re-reads the flag and, if the signed-in
 * state flipped, announces it so the cart (and anything else per-customer) reloads.
 */
export function AccountLink() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const last = useRef<boolean | null>(null);

  useEffect(() => {
    const read = () => {
      const now = signedInFlag();
      setSignedIn(now);
      const changed = last.current !== null && last.current !== now;
      last.current = now;
      if (changed) announceSessionChange();
    };
    const t = setTimeout(read, 0);
    const off = onSessionChange(read);
    return () => {
      clearTimeout(t);
      off();
    };
  }, [pathname]);

  return (
    <Link href={signedIn ? "/account" : "/login"} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium hover:bg-white/10">
      {signedIn ? "Account" : "Sign in"}
    </Link>
  );
}
