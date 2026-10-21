"use client";

import { lazy, Suspense, useState, useSyncExternalStore } from "react";
import { installGuide } from "@/lib/pwa/install-policy";
import { getServerSnapshot, getSnapshot, promptInstall, subscribe } from "@/lib/pwa/install-store";
import { recordDismissal } from "@/lib/pwa/install-storage";

const InstallGuide = lazy(() => import("./install-guide"));

/** Contextual, dismissible install prompt. The parent decides *when* to render it (see shouldShowBanner). */
export default function InstallBanner({ onDismiss }: { onDismiss: () => void }) {
  const install = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [guideOpen, setGuideOpen] = useState(false);

  function dismiss() {
    recordDismissal();
    onDismiss();
  }

  async function accept() {
    if (install.mode === "native") {
      const outcome = await promptInstall();
      if (outcome === "dismissed") dismiss(); // a cancelled native dialog counts as "not now"
      return;
    }
    setGuideOpen(true);
  }

  return (
    <>
      <section
        aria-label="Install the app"
        className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-sm sm:p-0"
      >
        <div className="rounded-2xl border border-gold/60 bg-ivory p-4 text-ink shadow-xl">
          <h2 className="font-semibold text-accent">Get the app</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>Opens in one tap from your home screen</li>
            <li>Loads faster on slow connections</li>
            <li>Recently viewed pages stay available offline (checkout always needs internet)</li>
          </ul>
          <div className="mt-4 flex gap-3">
            <button onClick={accept} className="min-h-11 flex-1 rounded-full bg-burgundy px-4 font-semibold text-ivory">
              {install.mode === "native" ? "Install" : "How to install"}
            </button>
            <button onClick={dismiss} className="min-h-11 rounded-full px-4 font-medium text-accent">
              Not now
            </button>
          </div>
        </div>
      </section>
      {guideOpen && (
        <Suspense fallback={null}>
          <InstallGuide guide={installGuide(install.platform, install.mode)} onClose={() => setGuideOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
