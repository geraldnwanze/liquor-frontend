"use client";

import { useId, useRef, useState } from "react";

/**
 * Instant filter for a short list that is already on the page (staff, pages, reviews, subscribers): rows marked
 * `data-filter-item` inside the element with id `targetId` are hidden when their text doesn't contain what you type. A
 * row can name what to match with `data-filter-text` (so hidden edit forms inside it don't count).
 * Nothing is sent anywhere, and clearing the box shows everything again.
 */
export function LiveFilter({ targetId, placeholder, label }: { targetId: string; placeholder: string; label: string }) {
  const inputId = useId();
  const [summary, setSummary] = useState("");
  const input = useRef<HTMLInputElement>(null);

  function apply(value: string) {
    const needle = value.toLowerCase().replace(/\s+/g, " ").trim();
    const rows = document.querySelectorAll<HTMLElement>(`#${CSS.escape(targetId)} [data-filter-item]`);
    let shown = 0;
    rows.forEach((row) => {
      const match = !needle || (row.dataset.filterText ?? row.textContent ?? "").toLowerCase().replace(/\s+/g, " ").includes(needle);
      row.hidden = !match;
      if (match) shown++;
    });
    setSummary(needle ? (shown === 0 ? "No matches" : `${shown} of ${rows.length} shown`) : "");
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <input
        id={inputId}
        ref={input}
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        onInput={(e) => apply(e.currentTarget.value)}
        onKeyUp={(e) => apply(e.currentTarget.value)}
        className="h-10 w-full max-w-sm rounded-lg border border-stone-300 bg-white px-3 text-sm text-ink"
      />
      <p role="status" className="text-sm text-muted">{summary}</p>
    </div>
  );
}
