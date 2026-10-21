"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { SearchSuggestion } from "@/app/api/search/route";
import { normalizeQuery } from "@/lib/search/normalize";

type State = { q: string; results: SearchSuggestion[]; total: number; status: "idle" | "loading" | "done" | "error" };
const EMPTY: State = { q: "", results: [], total: 0, status: "idle" };

/**
 * Store-wide search that answers as you type. Without JavaScript (or when you press Enter on nothing highlighted) it
 * is still a plain GET form to /search, so every result page is shareable. The list follows the ARIA combobox
 * pattern: arrow keys move through results, Enter opens one, Escape closes.
 */
export function SearchBox({ className = "", id }: { className?: string; id: string }) {
  const router = useRouter();
  const listId = useId();
  const [text, setText] = useState("");
  const [state, setState] = useState<State>(EMPTY);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLFormElement>(null);
  const controller = useRef<AbortController | null>(null);
  const lastTerm = useRef<string | null>(null);

  const term = normalizeQuery(text);

  /**
   * Asks the API for suggestions the moment the text changes: on every key release (and on input, which also covers
   * paste, cut and phone keyboards that don't send key events). Pressing arrows doesn't change the text, so it
   * doesn't search again, and each new request cancels the one still in flight.
   */
  async function run(value: string) {
    const t = normalizeQuery(value);
    if (!t) {
      controller.current?.abort();
      lastTerm.current = null;
      return;
    }
    if (t === lastTerm.current) return;
    lastTerm.current = t;
    controller.current?.abort();
    const c = new AbortController();
    controller.current = c;
    setState((prev) => ({ ...prev, q: t, status: "loading" }));
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(t)}`, { signal: c.signal });
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as { results: SearchSuggestion[]; total: number };
      setState({ q: t, results: data.results, total: data.total, status: "done" });
      setActive(-1);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setState({ q: t, results: [], total: 0, status: "error" });
    }
  }

  useEffect(() => () => controller.current?.abort(), []);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const showing = open && term !== null;
  const current = state.q === term ? state : { ...EMPTY, q: term ?? "", status: term ? ("loading" as const) : ("idle" as const) };
  const options = current.results.length;
  const seeAllIndex = options; // the last row, "See all results"
  const lastIndex = options > 0 ? options : -1;

  function go(index: number) {
    setOpen(false);
    if (index >= 0 && index < options) router.push(`/products/${current.results[index].slug}`);
    else if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showing || lastIndex < 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i >= lastIndex ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? lastIndex : i - 1));
    }
  }

  return (
    <form
      ref={root}
      action="/search"
      role="search"
      className={`relative ${className}`}
      onSubmit={(e) => {
        if (active >= 0) {
          e.preventDefault();
          go(active);
        }
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search wine, whiskey, rum, gin and more
      </label>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gold" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
      <input
        id={id}
        type="search"
        name="q"
        role="combobox"
        aria-expanded={showing}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showing && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        maxLength={100}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(-1);
          void run(e.target.value);
        }}
        onKeyUp={(e) => void run(e.currentTarget.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search whiskey, wine, gin…"
        className="h-11 w-full rounded-full border border-gold/25 bg-white/5 pl-11 pr-24 text-sm text-ink placeholder:text-muted focus:border-gold focus:bg-white/10"
      />
      <button className="absolute right-1 top-1 h-9 rounded-full bg-gold px-4 text-sm font-semibold text-midnight transition hover:bg-[#dcb86e]">Search</button>

      <div id={listId} role="listbox" aria-label="Search suggestions" hidden={!showing} className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-gold/25 bg-[#17110f] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)]">
        {showing && (
          <>
            {current.status === "loading" && options === 0 && <p className="px-4 py-3 text-sm text-muted">Searching…</p>}
            {current.status === "error" && <p className="px-4 py-3 text-sm text-danger">Search is unavailable right now. Press Enter to search the full list.</p>}
            {current.status === "done" && options === 0 && <p className="px-4 py-3 text-sm text-muted">No products match &ldquo;{current.q}&rdquo;.</p>}
            {options > 0 && (
              <ul>
                {current.results.map((r, i) => (
                  <li key={r.slug} id={`${listId}-${i}`} role="option" aria-selected={active === i} onMouseEnter={() => setActive(i)} onClick={() => go(i)} className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${active === i ? "bg-gold/15" : ""}`}>
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-gold/15 bg-white/5">
                      {r.image ? <Image src={r.image.url} alt="" fill sizes="44px" className="object-cover" /> : <span aria-hidden="true" className="grid size-full place-items-center font-display text-gold">{r.name.charAt(0)}</span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{r.name}</span>
                      <span className="block truncate text-xs text-muted">{r.brand ?? ""}{r.inStock ? "" : `${r.brand ? " · " : ""}Out of stock`}</span>
                    </span>
                    {r.price && <span className="shrink-0 text-sm font-semibold text-accent">{r.price}</span>}
                  </li>
                ))}
                <li id={`${listId}-${seeAllIndex}`} role="option" aria-selected={active === seeAllIndex} onMouseEnter={() => setActive(seeAllIndex)} onClick={() => go(-1)} className={`cursor-pointer border-t border-gold/15 px-4 py-3 text-sm font-medium text-gold ${active === seeAllIndex ? "bg-gold/15" : ""}`}>
                  See all {current.total} {current.total === 1 ? "result" : "results"} for &ldquo;{current.q}&rdquo; →
                </li>
              </ul>
            )}
          </>
        )}
      </div>
      <p role="status" className="sr-only">
        {showing && current.status === "done" ? (options === 0 ? "No suggestions" : `${current.total} ${current.total === 1 ? "result" : "results"} available`) : ""}
      </p>
    </form>
  );
}
