"use client";

import { useActionState, useState } from "react";
import { createDiscountAction, updateDiscountAction } from "@/app/actions/admin-discounts";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary } from "@/components/admin/form-styles";
import { ProductPicker } from "@/components/admin/product-picker";
import { Field } from "@/components/ui/field";
import { isoToLagosInput } from "@/lib/admin/discount-format";
import { IDLE } from "@/lib/auth/form-state";
import type { AdminDiscount } from "@/lib/api/types";
import { koboToNairaInput } from "@/lib/format";

type Category = { id: string; name: string; parent_id: string | null };

export function DiscountForm({ discount, categories }: { discount?: AdminDiscount; categories: Category[] }) {
  const [state, action, pending] = useActionState(discount ? updateDiscountAction.bind(null, discount.id) : createDiscountAction, IDLE);
  const [type, setType] = useState<string>(discount?.type ?? "percentage");
  const [scope, setScope] = useState<string>(discount?.scope ?? "order");
  const err = (k: string) => fieldError(state, k);
  const chosenCategories = new Set((discount?.categories ?? []).map((c) => c.id));

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Code" error={err("code")} hint="What customers type. Letters, numbers, - and _; not case-sensitive.">
        {(p) => <input name="code" required maxLength={32} defaultValue={discount?.code} className={`${input} font-mono uppercase`} {...p} />}
      </Field>
      <Field label="Name" error={err("name")} hint="For your team only, e.g. “October welcome offer”.">
        {(p) => <input name="name" required maxLength={120} defaultValue={discount?.name} className={input} {...p} />}
      </Field>

      <Field label="Type" error={err("type")}>
        {(p) => (
          <select name="type" value={type} onChange={(e) => { setType(e.target.value); if (e.target.value === "free_delivery") setScope("order"); }} className={input} {...p}>
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
            <option value="free_delivery">Free delivery</option>
          </select>
        )}
      </Field>
      {type === "percentage" && <Field label="Percent off (1-100)" error={err("percent")}>{(p) => <input name="percent" required inputMode="numeric" defaultValue={discount?.percent ?? ""} className={input} {...p} />}</Field>}
      {type === "fixed" && <Field label="Amount off (₦)" error={err("amount_kobo")}>{(p) => <input name="amount" required inputMode="decimal" defaultValue={koboToNairaInput(discount?.amount_kobo)} className={input} {...p} />}</Field>}
      {type === "percentage" && <Field label="Most it can take off (₦)" error={err("max_discount_kobo")} hint="Optional cap.">{(p) => <input name="max_discount" inputMode="decimal" defaultValue={koboToNairaInput(discount?.max_discount_kobo)} className={input} {...p} />}</Field>}
      {type === "free_delivery" && <p className="self-end pb-2 text-sm text-muted">Takes the whole delivery fee off. Applies to the whole order.</p>}

      <Field label="Minimum order (₦)" error={err("min_order_kobo")} hint="Judged on the items the code covers. Blank for none.">
        {(p) => <input name="min_order" inputMode="decimal" defaultValue={koboToNairaInput(discount?.min_order_kobo)} className={input} {...p} />}
      </Field>
      <Field label="Applies to" error={err("scope")}>
        {(p) => (
          <select name="scope" value={scope} onChange={(e) => setScope(e.target.value)} className={input} {...p}>
            <option value="order">The whole order</option>
            {type !== "free_delivery" && <option value="products">Chosen products</option>}
            {type !== "free_delivery" && <option value="categories">Chosen categories</option>}
          </select>
        )}
      </Field>

      {scope === "products" && (
        <div className="sm:col-span-2">
          <ProductPicker initial={(discount?.products ?? []).map((p) => ({ id: p.id, name: p.name }))} />
          {err("product_ids") && <p role="alert" className="mt-1 text-sm text-red-700">{err("product_ids")}</p>}
        </div>
      )}
      {scope === "categories" && (
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium">Categories (a category also covers the ones inside it)</legend>
          <div className="grid gap-1 sm:grid-cols-2">
            {categories.map((c) => (
              <label key={c.id} className={`flex items-center gap-2 text-sm ${c.parent_id ? "ml-5" : "font-medium"}`}>
                <input type="checkbox" name="category_ids" value={c.id} defaultChecked={chosenCategories.has(c.id)} className="size-4" /> {c.name}
              </label>
            ))}
          </div>
          {err("category_ids") && <p role="alert" className="mt-1 text-sm text-red-700">{err("category_ids")}</p>}
        </fieldset>
      )}

      <Field label="Starts (Nigerian time)" error={err("starts_at")} hint="Blank to start immediately.">{(p) => <input type="datetime-local" name="starts_at" defaultValue={isoToLagosInput(discount?.starts_at)} className={input} {...p} />}</Field>
      <Field label="Ends (Nigerian time)" error={err("ends_at")} hint="Blank for no end date.">{(p) => <input type="datetime-local" name="ends_at" defaultValue={isoToLagosInput(discount?.ends_at)} className={input} {...p} />}</Field>
      <Field label="Total uses allowed" error={err("usage_limit")} hint="Blank for unlimited.">{(p) => <input name="usage_limit" inputMode="numeric" defaultValue={discount?.usage_limit ?? ""} className={input} {...p} />}</Field>
      <Field label="Uses per customer" error={err("per_customer_limit")} hint="Matched by account and by checkout email.">{(p) => <input name="per_customer_limit" inputMode="numeric" defaultValue={discount?.per_customer_limit ?? ""} className={input} {...p} />}</Field>

      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={discount?.is_active ?? true} className="size-4" /> Switched on (customers can use it)</label>

      <div className="flex flex-col gap-2 sm:col-span-2">
        <button disabled={pending} className={`${primary} self-start`}>{pending ? "Saving…" : discount ? "Save discount" : "Create discount"}</button>
        <FormResult state={state} />
      </div>
    </form>
  );
}
