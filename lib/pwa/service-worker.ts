/** Thin helpers for talking to the service worker. All are no-ops when workers are unsupported. */

export function canUseServiceWorker(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

/** Registers the worker in production only, so dev servers never serve stale cached assets. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!canUseServiceWorker() || process.env.NODE_ENV !== "production") return null;
  try {
    // updateViaCache:none makes the browser revalidate sw.js itself on every update check.
    return await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  } catch {
    return null; // the site works without a worker
  }
}

/** Ask the worker whether this page load was answered from its saved copy (so the UI can say so). */
export async function wasServedFromCache(url: string): Promise<boolean> {
  if (!canUseServiceWorker()) return false;
  const controller = navigator.serviceWorker.controller;
  if (!controller) return false;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), 500);
    channel.port1.onmessage = (e: MessageEvent<boolean>) => {
      clearTimeout(timer);
      resolve(e.data === true);
    };
    controller.postMessage({ type: "WAS_CACHED", url }, [channel.port2]);
  });
}

/** Call on logout: removes anything the worker saved for this browser session. */
export async function clearUserData(): Promise<void> {
  if (!canUseServiceWorker()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  reg?.active?.postMessage({ type: "CLEAR_USER_DATA" });
}
