"use client";

import { useActionState } from "react";
import { createZoneAction, deleteZoneAction, updateZoneAction } from "@/app/actions/admin-settings";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";
import type { AdminDeliveryZone } from "@/lib/api/types";
import { koboToNairaInput } from "@/lib/format";

function ZoneFields({ zone, errorOf }: { zone?: AdminDeliveryZone; errorOf: (k: string) => string | undefined }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Name" error={errorOf("name")} hint="For your team, e.g. Lagos Mainland.">{(p) => <input name="name" required maxLength={120} defaultValue={zone?.name} className={input} {...p} />}</Field>
      <Field label="State" error={errorOf("state")}>{(p) => <input name="state" required maxLength={80} defaultValue={zone?.state} className={input} {...p} />}</Field>
      <Field label="City or area" error={errorOf("city")} hint="Blank covers the whole state.">{(p) => <input name="city" maxLength={80} defaultValue={zone?.city ?? ""} className={input} {...p} />}</Field>
      <Field label="Delivery fee (₦)" error={errorOf("fee_kobo")} hint="0 for free delivery.">{(p) => <input name="fee" required inputMode="decimal" defaultValue={koboToNairaInput(zone?.fee_kobo)} className={input} {...p} />}</Field>
      <Field label="Free delivery over (₦)" error={errorOf("free_threshold_kobo")} hint="Blank for no threshold. Judged before discounts.">{(p) => <input name="free_threshold" inputMode="decimal" defaultValue={koboToNairaInput(zone?.free_threshold_kobo)} className={input} {...p} />}</Field>
      <Field label="Sort order" error={errorOf("sort_order")}>{(p) => <input name="sort_order" inputMode="numeric" defaultValue={zone?.sort_order ?? 0} className={input} {...p} />}</Field>
      <Field label="Fastest (days)" error={errorOf("estimated_days_min")}>{(p) => <input name="estimated_days_min" inputMode="numeric" defaultValue={zone?.estimated_days_min ?? ""} className={input} {...p} />}</Field>
      <Field label="Slowest (days)" error={errorOf("estimated_days_max")}>{(p) => <input name="estimated_days_max" inputMode="numeric" defaultValue={zone?.estimated_days_max ?? ""} className={input} {...p} />}</Field>
      <div className="sm:col-span-2"><Field label="Notes for customers" error={errorOf("notes")}>{(p) => <input name="notes" maxLength={500} defaultValue={zone?.notes ?? ""} className={input} {...p} />}</Field></div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="is_active" defaultChecked={zone?.is_active ?? true} className="size-4" /> We deliver here (shown at checkout)</label>
    </div>
  );
}

export function EditZone({ zone }: { zone: AdminDeliveryZone }) {
  const [state, action, pending] = useActionState(updateZoneAction.bind(null, zone.id), IDLE);
  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-col gap-3">
        <ZoneFields zone={zone} errorOf={(k) => fieldError(state, k)} />
        <div className="flex flex-col gap-2"><button disabled={pending} className={`${primary} self-start`}>{pending ? "Saving…" : "Save zone"}</button><FormResult state={state} /></div>
      </form>
      <div className="border-t border-stone-200 pt-4"><ConfirmButton tone="danger" label="Delete zone" confirmLabel="Yes, delete zone" run={() => deleteZoneAction(zone.id)} /></div>
    </div>
  );
}

export function AddZone() {
  const [state, action, pending] = useActionState(createZoneAction, IDLE);
  return (
    <details className="rounded-lg border border-stone-200 p-4">
      <summary className="cursor-pointer text-sm font-medium">Add a delivery zone</summary>
      <form action={action} key={state.status === "success" ? "ok" : "open"} className="mt-4 flex flex-col gap-3">
        <ZoneFields errorOf={(k) => fieldError(state, k)} />
        <div className="flex flex-col gap-2"><button disabled={pending} className={`${primary} self-start`}>{pending ? "Adding…" : "Add zone"}</button><FormResult state={state} /></div>
      </form>
    </details>
  );
}
