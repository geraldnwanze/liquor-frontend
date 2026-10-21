"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "@/app/actions/admin-settings";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary, textarea } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";
import type { AdminSettings } from "@/lib/api/types";

export function SettingsForm({ settings }: { settings: AdminSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, IDLE);
  const err = (k: string) => fieldError(state, k);
  const b = settings.business;
  const c = settings.commerce;

  return (
    <form action={action} className="space-y-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted">Business details on receipts</legend>
        <Field label="Business name" error={err("business.name")} hint={`Blank uses “${settings.defaults.business_name}”.`}>{(p) => <input name="name" maxLength={120} defaultValue={b.name ?? ""} className={input} {...p} />}</Field>
        <Field label="Registration number" error={err("business.registration_number")} hint="Only what you can show, e.g. your CAC number.">{(p) => <input name="registration_number" maxLength={60} defaultValue={b.registration_number ?? ""} className={input} {...p} />}</Field>
        <div className="sm:col-span-2"><Field label="Address" error={err("business.address")}>{(p) => <input name="address" maxLength={300} defaultValue={b.address ?? ""} className={input} {...p} />}</Field></div>
        <Field label="Phone" error={err("business.phone")}>{(p) => <input name="phone" inputMode="tel" maxLength={40} defaultValue={b.phone ?? ""} className={input} {...p} />}</Field>
        <Field label="Email" error={err("business.email")}>{(p) => <input name="email" type="email" maxLength={190} defaultValue={b.email ?? ""} className={input} {...p} />}</Field>
        <div className="sm:col-span-2"><Field label="Receipt footer" error={err("business.receipt_footer")} hint="A line at the bottom of every receipt, e.g. a returns note.">{(p) => <textarea name="receipt_footer" rows={2} maxLength={300} defaultValue={b.receipt_footer ?? ""} className={textarea} {...p} />}</Field></div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold uppercase tracking-wider text-muted">Ordering limits</legend>
        <Field label="Minimum age" error={err("commerce.minimum_age")} hint="Can be raised, never set below 18. The age check is a self-declaration, not proof of age. Confirm your obligations with qualified local counsel.">
          {(p) => <input name="minimum_age" required inputMode="numeric" defaultValue={c.minimum_age} className={input} {...p} />}
        </Field>
        <Field label="Hold items for (minutes)" error={err("commerce.reservation_minutes")} hint="How long unpaid orders keep their stock before it is released (5-240).">
          {(p) => <input name="reservation_minutes" required inputMode="numeric" defaultValue={c.reservation_minutes} className={input} {...p} />}
        </Field>
        <Field label="Most of one item per order" error={err("commerce.max_quantity_per_line")}>
          {(p) => <input name="max_quantity_per_line" required inputMode="numeric" defaultValue={c.max_quantity_per_line} className={input} {...p} />}
        </Field>
        <Field label="Most items in one order" error={err("commerce.max_units_per_order")} hint="Can't be lower than the limit per item.">
          {(p) => <input name="max_units_per_order" required inputMode="numeric" defaultValue={c.max_units_per_order} className={input} {...p} />}
        </Field>
      </fieldset>

      <div className="flex flex-col gap-2">
        <button disabled={pending} className={`${primary} self-start`}>{pending ? "Saving…" : "Save settings"}</button>
        <FormResult state={state} />
      </div>
    </form>
  );
}
