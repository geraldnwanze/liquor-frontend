"use client";

import { useId, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";

/**
 * "Have a code?" for the cart and checkout. The server decides whether a code works and by how much; this only
 * collects the text and shows the answer. One code per order, so applying a new one replaces the old one.
 */
export function DiscountBox({ delivery }: { delivery?: { state: string; city: string } }) {
  const { cart, applyCode, removeCode, busyItemId, online } = useCart();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const id = useId();
  const busy = busyItemId === "discount";
  const discount = cart.discount;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setError(null);
    const result = await applyCode(code, delivery);
    if (result.ok) {
      setCode("");
      setOpen(false);
    } else {
      setError(result.code === "rate_limited" ? "Too many tries. Please wait a minute." : result.message);
    }
  }

  if (discount) {
    return (
      <div className="rounded-lg border border-burgundy/15 bg-white p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p>
            <span className="rounded bg-gold/25 px-2 py-0.5 font-mono text-xs font-semibold">{discount.code}</span>
            {discount.applied && <span className="ml-2">{discount.free_delivery ? "Free delivery" : `${discount.amount.formatted} off`}</span>}
          </p>
          <button type="button" disabled={busy || !online} onClick={() => void removeCode(delivery)} className="min-h-11 px-2 text-accent underline disabled:opacity-60">
            Remove
          </button>
        </div>
        {!discount.applied && discount.problem && (
          <p role="alert" className="mt-1 text-danger">
            {discount.problem.message} It isn&apos;t reducing your total.
          </p>
        )}
        {error && <p role="alert" className="mt-1 text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="text-sm">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="min-h-11 text-accent underline">
          Have a discount code?
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-2" noValidate>
          <label htmlFor={id} className="font-medium">
            Discount code
          </label>
          <div className="flex gap-2">
            <input
              id={id}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={32}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-err` : undefined}
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-ink/40 bg-white px-3 font-mono uppercase aria-[invalid=true]:border-danger aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger"
            />
            <button disabled={busy || !code.trim() || !online} className="min-h-12 rounded-full bg-gold px-5 font-semibold text-midnight disabled:opacity-60 transition hover:bg-[#dcb86e]">
              {busy ? "Checking…" : "Apply"}
            </button>
          </div>
          {error && (
            <p id={`${id}-err`} role="alert" className="text-danger">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
