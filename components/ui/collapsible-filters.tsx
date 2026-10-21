"use client";

import { useId, useState } from "react";

/**
 * Filters that collapse behind a button on phones and are always shown from the `sm` breakpoint up. (A closed
 * <details> cannot do this: its content stays hidden whatever the screen size.)
 */
export function CollapsibleFilters({ label, startOpen, buttonClassName, children }: { label: string; startOpen: boolean; buttonClassName: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(startOpen);
  const id = useId();
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={id} className={`flex w-full items-center justify-between sm:hidden ${buttonClassName}`}>
        {label}
        <span aria-hidden="true" className={`transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      <div id={id} className={`${open ? "mt-2 block" : "hidden"} sm:mt-0 sm:block`}>
        {children}
      </div>
    </div>
  );
}
