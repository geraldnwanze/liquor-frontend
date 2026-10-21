"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { ProductVariant } from "@/lib/api/types";
import { Price } from "./price";

/** Size selector. Prices shown are for information only; the server re-prices everything at cart and checkout. */
export function VariantPicker({ variants, discontinued, maxQuantity }: { variants: ProductVariant[]; discontinued: boolean; maxQuantity: number }) {
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [selectedId, setSelectedId] = useState(() => (variants.find((v) => v.in_stock) ?? variants[0])?.id);
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) return <p className="text-muted">This product is not currently available.</p>;

  const canBuy = selected.in_stock && !discontinued;
  const adding = cart.busyItemId === "add";

  async function addToCart() {
    setFeedback(null);
    const result = await cart.add(selected.id, quantity);
    if (result.ok) {
      setFeedback({ ok: true, text: `Added ${quantity} × ${selected.name} to your cart.` });
      cart.openDrawer();
    } else {
      setFeedback({ ok: false, text: result.message });
    }
  }

  const status = discontinued ? "Discontinued" : !selected.in_stock ? "Out of stock" : selected.low_stock ? "Low stock" : "In stock";

  return (
    <div className="space-y-4">
      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Size</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <label
                key={v.id}
                className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                  v.id === selected.id ? "border-gold bg-gold/15 text-accent" : "border-white/15 bg-white hover:border-gold/50"
                } ${!v.in_stock ? "opacity-60" : ""}`}
              >
                <input type="radio" name="variant" value={v.id} checked={v.id === selected.id} onChange={() => setSelectedId(v.id)} className="sr-only" />
                {v.name}
                {!v.in_stock && <span className="sr-only"> (out of stock)</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Price current={selected.sale_price ?? selected.price} regular={selected.sale_price ? selected.price : null} className="text-2xl" />
      <p role="status" className={selected.in_stock && !discontinued ? "text-sm text-emerald-400" : "text-sm text-rose-300"}>
        {status} <span className="text-muted">· SKU {selected.sku}</span>
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Quantity
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            disabled={!canBuy}
            className="min-h-12 rounded-lg border border-gold/25 bg-[#0f0b0a] px-3 text-ink disabled:opacity-50"
          >
            {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={addToCart}
          disabled={!canBuy || adding || !cart.online}
          className="min-h-12 flex-1 rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {discontinued ? "No longer available" : !selected.in_stock ? "Out of stock" : adding ? "Adding…" : "Add to cart"}
        </button>
      </div>
      {!cart.online && <p className="text-sm text-muted">You&apos;re offline. Reconnect to add items to your cart.</p>}
      <p role={feedback?.ok === false ? "alert" : "status"} className={`min-h-5 text-sm ${feedback?.ok === false ? "text-rose-300" : "text-emerald-400"}`}>
        {feedback?.text}
      </p>
    </div>
  );
}
