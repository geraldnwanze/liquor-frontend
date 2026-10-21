"use client";

import { useActionState } from "react";
import { addVariantAction, adjustStockAction, deleteVariantAction, updateVariantAction } from "@/app/actions/admin-catalog";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary, secondary } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";
import type { AdminVariant } from "@/lib/api/types";
import { koboToNairaInput } from "@/lib/format";
import { formatNaira } from "@/lib/money";

const REASONS: [string, string][] = [["received", "Stock received"], ["correction", "Count correction"], ["damaged", "Damaged or lost"], ["returned", "Returned to shelf"]];

function VariantFields({ variant, canSeeCost, creating, errorOf }: { variant?: AdminVariant; canSeeCost: boolean; creating: boolean; errorOf: (k: string) => string | undefined }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Name" error={errorOf("name")} hint="e.g. 750 ml">{(p) => <input name="name" required maxLength={80} defaultValue={variant?.name} className={input} {...p} />}</Field>
      <Field label="SKU" error={errorOf("sku")}>{(p) => <input name="sku" required maxLength={64} defaultValue={variant?.sku} className={input} {...p} />}</Field>
      <Field label="Price (₦)" error={errorOf("price_kobo")}>{(p) => <input name="price" required inputMode="decimal" defaultValue={koboToNairaInput(variant?.price_kobo)} className={input} {...p} />}</Field>
      <Field label="Sale price (₦)" error={errorOf("sale_price_kobo")} hint="Blank for no sale. Must be lower than the price.">{(p) => <input name="sale_price" inputMode="decimal" defaultValue={koboToNairaInput(variant?.sale_price_kobo)} className={input} {...p} />}</Field>
      {canSeeCost && <Field label="Cost price (₦)" error={errorOf("cost_price_kobo")}>{(p) => <input name="cost_price" inputMode="decimal" defaultValue={koboToNairaInput(variant?.cost_price_kobo)} className={input} {...p} />}</Field>}
      <Field label="Volume (ml)" error={errorOf("volume_ml")}>{(p) => <input name="volume_ml" inputMode="numeric" defaultValue={variant?.volume_ml ?? ""} className={input} {...p} />}</Field>
      <Field label="Barcode" error={errorOf("barcode")}>{(p) => <input name="barcode" maxLength={64} defaultValue={variant?.barcode ?? ""} className={input} {...p} />}</Field>
      <Field label="Low-stock alert at" error={errorOf("low_stock_threshold")}>{(p) => <input name="low_stock_threshold" inputMode="numeric" defaultValue={variant?.low_stock_threshold ?? 5} className={input} {...p} />}</Field>
      {creating && <Field label="Opening stock" error={errorOf("initial_stock")} hint="Recorded in the stock history.">{(p) => <input name="initial_stock" inputMode="numeric" defaultValue="0" className={input} {...p} />}</Field>}
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={variant?.is_active ?? true} className="size-4" /> Active (can be bought)</label>
    </div>
  );
}

function EditVariant({ productId, variant, canSeeCost }: { productId: string; variant: AdminVariant; canSeeCost: boolean }) {
  const [state, action, pending] = useActionState(updateVariantAction.bind(null, productId, variant.id), IDLE);
  return (
    <form action={action} className="flex flex-col gap-3">
      <VariantFields variant={variant} canSeeCost={canSeeCost} creating={false} errorOf={(k) => fieldError(state, k)} />
      <div className="flex flex-col gap-2"><button disabled={pending} className={`${primary} self-start`}>{pending ? "Saving…" : "Save variant"}</button><FormResult state={state} /></div>
    </form>
  );
}

function StockForm({ productId, variant }: { productId: string; variant: AdminVariant }) {
  const [state, action, pending] = useActionState(adjustStockAction.bind(null, productId, variant.id), IDLE);
  return (
    <form action={action} key={state.status === "success" ? "ok" : "open"} className="grid gap-3 sm:grid-cols-3">
      <Field label="Change (+ add, - remove)" error={fieldError(state, "delta")}>{(p) => <input name="delta" required inputMode="numeric" className={input} {...p} />}</Field>
      <Field label="Reason" error={fieldError(state, "reason")}>{(p) => <select name="reason" className={input} {...p}>{REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}</Field>
      <Field label="Note" error={fieldError(state, "note")}>{(p) => <input name="note" maxLength={500} className={input} {...p} />}</Field>
      <div className="flex flex-col gap-2 sm:col-span-3"><button disabled={pending} className={`${secondary} self-start`}>{pending ? "Updating…" : "Adjust stock"}</button><FormResult state={state} /></div>
    </form>
  );
}

export function VariantsPanel({ productId, variants, canSeeCost, canAdjustStock, historyVariantId }: { productId: string; variants: AdminVariant[]; canSeeCost: boolean; canAdjustStock: boolean; historyVariantId: string | null }) {
  return (
    <ul className="divide-y divide-stone-100">
      {variants.map((v) => {
        const low = v.is_active && v.available <= v.low_stock_threshold;
        return (
          <li key={v.id} className="py-3">
            <details open={v.id === historyVariantId}>
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm">
                <span><span className="font-medium">{v.name}</span> <span className="text-xs text-muted">{v.sku}</span>{!v.is_active && <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-700">Inactive</span>}</span>
                <span className="flex items-center gap-4 tabular-nums">
                  <span>{v.sale_price_kobo ? <><s className="text-muted">{formatNaira(v.price_kobo)}</s> {formatNaira(v.sale_price_kobo)}</> : formatNaira(v.price_kobo)}</span>
                  <span className={low ? "font-semibold text-red-700" : "text-muted"}>{v.available} available{low && <span className="sr-only"> (low stock)</span>}</span>
                </span>
              </summary>
              <div className="mt-4 space-y-5 rounded-lg bg-stone-50 p-4">
                <p className="text-xs text-muted">On hand {v.on_hand} · reserved {v.reserved} (held for unpaid orders)</p>
                <EditVariant productId={productId} variant={v} canSeeCost={canSeeCost} />
                {canAdjustStock && (
                  <div className="border-t border-stone-200 pt-4">
                    <h3 className="mb-3 text-sm font-semibold">Adjust stock</h3>
                    <StockForm productId={productId} variant={v} />
                    <a href={`?history=${v.id}#variants`} className="mt-3 inline-block text-sm text-burgundy hover:underline">Show stock history</a>
                  </div>
                )}
                <div className="border-t border-stone-200 pt-4">
                  <ConfirmButton tone="danger" label="Delete variant" confirmLabel="Yes, delete variant" run={() => deleteVariantAction(productId, v.id)} />
                </div>
              </div>
            </details>
          </li>
        );
      })}
      {variants.length === 0 && <li className="py-4 text-sm text-muted">No variants yet. A product needs at least one active variant to be published.</li>}
    </ul>
  );
}

export function AddVariant({ productId, canSeeCost }: { productId: string; canSeeCost: boolean }) {
  const [state, action, pending] = useActionState(addVariantAction.bind(null, productId), IDLE);
  return (
    <details className="rounded-lg border border-stone-200 p-4">
      <summary className="cursor-pointer text-sm font-medium">Add a variant</summary>
      <form action={action} key={state.status === "success" ? "ok" : "open"} className="mt-4 flex flex-col gap-3">
        <VariantFields canSeeCost={canSeeCost} creating errorOf={(k) => fieldError(state, k)} />
        <div className="flex flex-col gap-2"><button disabled={pending} className={`${primary} self-start`}>{pending ? "Adding…" : "Add variant"}</button><FormResult state={state} /></div>
      </form>
    </details>
  );
}
