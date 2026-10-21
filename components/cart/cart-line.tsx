"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductImage } from "@/components/catalog/product-image";
import type { CartItem } from "@/lib/api/types";
import { issueMessage } from "@/lib/cart/messages";
import { useCart } from "./cart-provider";

export function CartLine({ item }: { item: CartItem }) {
  const { setQuantity, remove, busyItemId, closeDrawer, online, stale } = useCart();
  const [error, setError] = useState<string | null>(null);
  const busy = busyItemId === item.id;
  const locked = busyItemId !== null || !online || stale;
  const unavailable = item.issues.includes("unavailable") || item.issues.includes("out_of_stock");
  const name = item.product.name;

  async function change(quantity: number) {
    setError(null);
    const result = await setQuantity(item.id, quantity);
    if (!result.ok) setError(result.message);
  }

  async function drop() {
    setError(null);
    const result = await remove(item.id);
    if (!result.ok) setError(result.message);
  }

  return (
    <li className={`py-4 ${busy ? "opacity-60" : ""}`} aria-busy={busy}>
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-white">
          <ProductImage image={item.product.image} name={name} sizes="80px" />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/products/${item.product.slug}`} onClick={closeDrawer} className="font-medium leading-snug hover:text-accent">
            {name}
          </Link>
          <p className="text-sm text-muted">{item.variant.name}</p>
          <p className="mt-1 text-sm">
            {item.unit_price.formatted}
            {item.price_changed_from && <span className="ml-2 text-xs text-accent">Price changed (was {item.price_changed_from.formatted})</span>}
          </p>
        </div>
        <p className="font-semibold">{unavailable ? "" : item.line_total.formatted}</p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center rounded-full border border-ink/40" role="group" aria-label={`Quantity for ${name}`}>
          <button
            onClick={() => change(item.quantity - 1)}
            disabled={locked || item.quantity <= 1}
            aria-label={`Decrease quantity of ${name}`}
            className="size-11 rounded-full text-lg disabled:opacity-40"
          >
            −
          </button>
          <output aria-live="polite" className="min-w-8 text-center">
            {item.quantity}
          </output>
          <button
            onClick={() => change(item.quantity + 1)}
            disabled={locked || unavailable || item.quantity >= item.max_quantity}
            aria-label={`Increase quantity of ${name}`}
            className="size-11 rounded-full text-lg disabled:opacity-40"
          >
            +
          </button>
        </div>
        <button onClick={drop} disabled={locked} aria-label={`Remove ${name} from cart`} className="min-h-11 px-3 text-sm text-accent underline underline-offset-4 disabled:opacity-40">
          Remove
        </button>
      </div>

      {item.issues.length > 0 && (
        <div className="mt-2 rounded-lg bg-danger/10 p-2 text-sm text-danger" role="alert">
          {item.issues.map((issue) => (
            <p key={issue}>{issueMessage(issue)}</p>
          ))}
          {item.issues.includes("insufficient_stock") && item.max_quantity > 0 && (
            <button onClick={() => change(item.max_quantity)} disabled={locked} className="mt-1 min-h-11 font-medium underline underline-offset-4">
              Reduce to {item.max_quantity}
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  );
}
