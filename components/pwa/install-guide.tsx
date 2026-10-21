"use client";

import { useEffect, useId, useRef } from "react";
import type { Guide } from "@/lib/pwa/install-policy";

/** Manual installation instructions in a native modal <dialog> (focus trap, Esc and backdrop handled by the browser). */
export default function InstallGuide({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-ivory p-6 text-ink shadow-xl backdrop:bg-black/50"
    >
      <h2 id={titleId} className="text-xl font-semibold text-accent">
        {guide.title}
      </h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5">
        {guide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {guide.note && <p className="mt-4 text-sm text-muted">{guide.note}</p>}
      <form method="dialog" className="mt-6">
        <button autoFocus className="min-h-12 w-full rounded-full bg-burgundy px-6 font-semibold text-ivory">
          Got it
        </button>
      </form>
    </dialog>
  );
}
