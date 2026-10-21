"use client";

import { useEffect, useId, useState } from "react";
import { searchProductsAction } from "@/app/actions/admin-discounts";
import { input } from "@/components/admin/form-styles";

type Picked = { id: string; name: string };

/** Type a name or SKU, pick products. The chosen ids travel in hidden `product_ids` fields. */
export function ProductPicker({ initial }: { initial: Picked[] }) {
  const [picked, setPicked] = useState<Picked[]>(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Picked[]>([]);
  const id = useId();

  useEffect(() => {
    if (query.trim().length < 2) return;
    let active = true;
    const t = setTimeout(() => {
      searchProductsAction(query)
        .then((r) => active && setResults(r.filter((p) => !picked.some((x) => x.id === p.id))))
        .catch(() => active && setResults([]));
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query, picked]);

  const shown = query.trim().length < 2 ? [] : results;

  return (
    <div>
      {picked.map((p) => <input key={p.id} type="hidden" name="product_ids" value={p.id} />)}
      <ul className="mb-2 flex flex-wrap gap-2" aria-label="Chosen products">
        {picked.map((p) => (
          <li key={p.id} className="flex items-center gap-1 rounded-full bg-stone-100 py-1 pl-3 pr-1 text-sm">
            {p.name}
            <button type="button" onClick={() => setPicked(picked.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.name}`} className="grid size-7 place-items-center rounded-full hover:bg-stone-200">×</button>
          </li>
        ))}
        {picked.length === 0 && <li className="text-sm text-muted">No products chosen yet.</li>}
      </ul>
      <label htmlFor={id} className="text-sm font-medium">Find a product</label>
      <input id={id} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or SKU" autoComplete="off" className={`${input} mt-1`} />
      {shown.length > 0 && (
        <ul className="mt-2 divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white text-sm">
          {shown.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => { setPicked([...picked, p]); setQuery(""); setResults([]); }} className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-stone-50">
                {p.name}<span className="text-burgundy">Add</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
