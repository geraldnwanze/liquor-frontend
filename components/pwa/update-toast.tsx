"use client";

import { useEffect, useRef } from "react";

/** Offers a waiting service-worker update. Activation (and the reload) happens only when the customer taps Update. */
export default function UpdateToast({ waiting, onLater }: { waiting: ServiceWorker; onLater: () => void }) {
  const requested = useRef(false);

  useEffect(() => {
    const onChange = () => {
      if (requested.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onChange);
  }, []);

  function update() {
    requested.current = true;
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-2xl bg-midnight p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-ivory shadow-xl sm:inset-x-auto sm:right-4 sm:max-w-sm"
    >
      <p className="flex-1 text-sm">A new version is available.</p>
      <button onClick={update} className="min-h-11 rounded-full bg-gold px-4 font-semibold text-midnight">
        Update
      </button>
      <button onClick={onLater} className="min-h-11 px-2 text-sm text-ivory/80">
        Later
      </button>
    </div>
  );
}
