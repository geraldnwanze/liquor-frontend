"use client";

import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { shouldShowBanner } from "@/lib/pwa/install-policy";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/pwa/install-store";
import { incrementPageViews, readDismissal } from "@/lib/pwa/install-storage";
import { registerServiceWorker } from "@/lib/pwa/service-worker";
import { isUpdateDeferred } from "@/lib/pwa/update-policy";
import { CachedNotice } from "./cached-notice";
import { ConnectivityBanner } from "./connectivity-banner";

// Loaded only when actually shown, so most visits never download this code.
const InstallBanner = lazy(() => import("./install-banner"));
const UpdateToast = lazy(() => import("./update-toast"));

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function PwaRoot() {
  const pathname = usePathname();
  const install = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [pageViews, setPageViews] = useState(0);
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);
  const [bannerClosed, setBannerClosed] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [updateLater, setUpdateLater] = useState(false);
  const [now, setNow] = useState(0);

  // Register once; watch for updates.
  useEffect(() => {
    document.documentElement.dataset.appReady = "";
    let teardown: (() => void) | undefined;
    let cancelled = false;

    registerServiceWorker().then((reg) => {
      if (!reg || cancelled) return;
      const surface = () => {
        // A waiting worker with no controller is the very first install, not an update.
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
      };
      surface();
      const onFound = () => {
        const worker = reg.installing;
        worker?.addEventListener("statechange", () => worker.state === "installed" && surface());
      };
      reg.addEventListener("updatefound", onFound);

      let lastCheck = Date.now();
      const onVisible = () => {
        if (document.visibilityState === "visible" && Date.now() - lastCheck > UPDATE_CHECK_INTERVAL_MS) {
          lastCheck = Date.now();
          reg.update().catch(() => {});
        }
      };
      document.addEventListener("visibilitychange", onVisible);
      teardown = () => {
        reg.removeEventListener("updatefound", onFound);
        document.removeEventListener("visibilitychange", onVisible);
      };
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  // Count page views for the "contextual" install prompt.
  useEffect(() => {
    const views = incrementPageViews();
    const dismissal = readDismissal();
    // Deferred so state is not set synchronously inside the effect.
    const t = setTimeout(() => {
      setPageViews(views);
      setDismissedUntil(dismissal?.until ?? null);
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(t);
  }, [pathname]);

  const showInstall =
    !bannerClosed &&
    !isUpdateDeferred(pathname) &&
    shouldShowBanner({
      standalone: install.standalone,
      installed: install.installed,
      mode: install.mode,
      pageViews,
      dismissedUntil,
      now,
    });

  const showUpdate = waiting !== null && !updateLater && !isUpdateDeferred(pathname);

  return (
    <>
      <div className="sticky top-0 z-50 empty:hidden">
        <ConnectivityBanner />
        <CachedNotice />
      </div>
      {install.installed && (
        <div role="status" className="fixed inset-x-3 bottom-3 z-50 rounded-2xl bg-emerald-800 p-4 text-center text-white shadow-xl sm:inset-x-auto sm:right-4">
          App installed. Open it from your home screen.
        </div>
      )}
      <Suspense fallback={null}>
        {showInstall && <InstallBanner onDismiss={() => setBannerClosed(true)} />}
        {showUpdate && waiting && <UpdateToast waiting={waiting} onLater={() => setUpdateLater(true)} />}
      </Suspense>
    </>
  );
}
