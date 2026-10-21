"use client";

import { lazy, Suspense, useState, useSyncExternalStore } from "react";
import { installGuide } from "@/lib/pwa/install-policy";
import { getServerSnapshot, getSnapshot, promptInstall, subscribe } from "@/lib/pwa/install-store";

const InstallGuide = lazy(() => import("./install-guide"));

/** Always-available install entry for the header or account menu. Hidden when installed or not installable. */
export function InstallButton({ className = "" }: { className?: string }) {
  const install = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [guideOpen, setGuideOpen] = useState(false);

  if (!install.ready || install.standalone || install.installed || install.mode === "unsupported") return null;

  async function onClick() {
    if (install.mode === "native" && (await promptInstall()) !== "unavailable") return;
    setGuideOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Install app"
        className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border border-gold/70 px-3 text-sm font-medium text-ivory hover:bg-white/10 sm:px-4 ${className}`}
      >
        <span aria-hidden="true" className="sm:hidden">Install</span>
        <span aria-hidden="true" className="hidden sm:inline">Install app</span>
      </button>
      {guideOpen && (
        <Suspense fallback={null}>
          <InstallGuide guide={installGuide(install.platform, install.mode)} onClose={() => setGuideOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
