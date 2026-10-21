"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getWishlistSlugsAction, setWishlistAction } from "@/app/actions/engagement";
import { onSessionChange } from "@/lib/auth/session-events";

type Value = { has: (slug: string) => boolean; toggle: (slug: string) => Promise<void>; count: number };
const Ctx = createContext<Value | null>(null);

const signedIn = () => document.cookie.split("; ").includes("lq_has_session=1");
const fetchSaved = async (): Promise<string[]> => (signedIn() ? getWishlistSlugsAction() : []);

/** Which products the signed-in customer has saved. Loaded in the browser, because shop pages are shared HTML. */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [slugs, setSlugs] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setSlugs(new Set(await fetchSaved()));
  }, []);

  useEffect(() => {
    let live = true;
    const refresh = () => void fetchSaved().then((saved) => live && setSlugs(new Set(saved)));
    refresh();
    const off = onSessionChange(refresh);
    return () => {
      live = false;
      off();
    };
  }, []);

  const toggle = useCallback(
    async (slug: string) => {
      if (!signedIn()) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const saving = !slugs.has(slug);
      setSlugs((prev) => {
        const next = new Set(prev);
        if (saving) next.add(slug);
        else next.delete(slug);
        return next;
      });
      const result = await setWishlistAction(slug, saving);
      if (result === "signed-out") router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      if (result !== "ok") void load(); // put the heart back to what the server says
    },
    [slugs, router, load],
  );

  const value = useMemo<Value>(() => ({ has: (s) => slugs.has(s), toggle, count: slugs.size }), [slugs, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist(): Value {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
