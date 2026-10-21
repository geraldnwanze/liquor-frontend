"use client";

import { useId, useState } from "react";

/**
 * "Edit" that opens a form in place, with `actions` (for example Delete) always visible beside it. The form is only
 * built when it is opened, so a long list doesn't carry (and render, and hydrate) one form per row up front.
 */
export function EditToggle({ children, actions, label = "Edit" }: { children: () => React.ReactNode; actions?: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="h-10 rounded-lg border border-stone-300 bg-white px-4 text-sm font-medium hover:bg-stone-50">
          {open ? "Close" : label}
        </button>
        {actions}
      </div>
      <div id={id} hidden={!open} className="mt-3">
        {open && children()}
      </div>
    </div>
  );
}
