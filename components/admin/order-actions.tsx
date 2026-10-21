"use client";

import { useActionState, useRef, useState } from "react";
import { addNoteAction, cancelOrderAction, moveFulfilmentAction, refundAction, saveShipmentAction } from "@/app/actions/admin";
import { Field } from "@/components/ui/field";
import { IDLE, type FormState } from "@/lib/auth/form-state";
import type { AdminOrder } from "@/lib/api/types";

const inputClass = "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm aria-[invalid=true]:border-red-500";
const button = "h-10 rounded-lg bg-burgundy px-5 text-sm font-semibold text-ivory hover:bg-burgundy-deep disabled:opacity-60";

function Result({ state }: { state: FormState }) {
  if (state.status === "idle") return null;
  return <p role={state.status === "error" ? "alert" : "status"} className={`text-sm ${state.status === "error" ? "text-red-700" : "text-emerald-800"}`}>{state.message}</p>;
}
/**
 * Two-step button for actions that cannot be undone. Arming is tied to the form state object, so as soon as the
 * action returns (success or error) the button goes back to its first step.
 */
function ConfirmSubmit({ state, pending, label, confirmLabel, tone }: { state: FormState; pending: boolean; label: string; confirmLabel: string; tone: "danger" | "primary" }) {
  const [armedAt, setArmedAt] = useState<FormState | null>(null);
  const armed = armedAt === state && !pending;
  const first = tone === "danger" ? "h-10 rounded-lg border border-red-300 px-5 text-sm font-semibold text-red-800 hover:bg-red-50" : button;
  if (!armed) {
    return <button type="button" disabled={pending} onClick={() => setArmedAt(state)} className={`${first} disabled:opacity-60`}>{pending ? "Working…" : label}</button>;
  }
  return (
    <div role="group" aria-label="Confirm" className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3">
      <span className="text-sm font-medium text-red-900">This can&apos;t be undone.</span>
      <button type="submit" className="h-10 rounded-lg bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800">{confirmLabel}</button>
      <button type="button" onClick={() => setArmedAt(null)} className="h-10 rounded-lg px-4 text-sm font-medium text-red-900 hover:bg-red-100">Back</button>
    </div>
  );
}

const fe = (s: FormState, k: string) => (s.status === "error" ? s.fieldErrors?.[k]?.[0] : undefined);

export function FulfilmentForm({ reference, next }: { reference: string; next: AdminOrder["next_fulfilment"] }) {
  const [state, action, pending] = useActionState(moveFulfilmentAction.bind(null, reference), IDLE);
  if (next.length === 0) return <p className="text-sm text-muted">No further fulfilment steps.</p>;
  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Move to" error={fe(state, "status")}>
        {(p) => <select name="status" required className={inputClass} {...p}>{next.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}</select>}
      </Field>
      <Field label="Note (shown in the history)" error={fe(state, "note")}>{(p) => <input name="note" maxLength={500} className={inputClass} {...p} />}</Field>
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Update fulfilment"}</button>
      <Result state={state} />
    </form>
  );
}

export function ShipmentForm({ reference, shipment }: { reference: string; shipment: AdminOrder["shipment"] }) {
  const [state, action, pending] = useActionState(saveShipmentAction.bind(null, reference), IDLE);
  const v = (k: keyof NonNullable<AdminOrder["shipment"]>) => (shipment?.[k] as string | null | undefined) ?? "";
  return (
    <form action={action} className="grid gap-3">
      <Field label="Carrier or rider" error={fe(state, "carrier")}>{(p) => <input name="carrier" defaultValue={v("carrier")} maxLength={80} className={inputClass} {...p} />}</Field>
      <Field label="Tracking reference" error={fe(state, "tracking_reference")}>{(p) => <input name="tracking_reference" defaultValue={v("tracking_reference")} maxLength={80} className={inputClass} {...p} />}</Field>
      <Field label="Carrier phone (staff only)" error={fe(state, "carrier_phone")}>{(p) => <input name="carrier_phone" defaultValue={v("carrier_phone")} inputMode="tel" maxLength={20} className={inputClass} {...p} />}</Field>
      <Field label="Estimated delivery" error={fe(state, "estimated_delivery_at")}>{(p) => <input type="date" name="estimated_delivery_at" defaultValue={v("estimated_delivery_at").slice(0, 10)} className={inputClass} {...p} />}</Field>
      <div><Field label="Internal notes" error={fe(state, "notes")}>{(p) => <input name="notes" defaultValue={v("notes")} maxLength={500} className={inputClass} {...p} />}</Field></div>
      <div className="flex flex-col gap-2"><button disabled={pending} className={button}>{pending ? "Saving…" : "Save shipment"}</button><Result state={state} /></div>
    </form>
  );
}

export function NoteForm({ reference }: { reference: string }) {
  const [state, action, pending] = useActionState(addNoteAction.bind(null, reference), IDLE);
  return (
    <form action={action} className="flex flex-col gap-3" key={state.status === "success" ? "done" : "open"}>
      <Field label="Internal note (customers never see this)" error={fe(state, "body")}>{(p) => <textarea name="body" rows={2} required minLength={2} maxLength={1000} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" {...p} />}</Field>
      <button disabled={pending} className={button}>{pending ? "Saving…" : "Add note"}</button>
      <Result state={state} />
    </form>
  );
}

export function CancelForm({ reference, paid }: { reference: string; paid: boolean }) {
  const [state, action, pending] = useActionState(cancelOrderAction.bind(null, reference), IDLE);
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-muted">{paid ? "This order is paid: cancelling refunds the customer in full through the gateway and returns the stock. Needs refund permission." : "Releases the reserved stock."}</p>
      <Field label="Reason" error={fe(state, "reason")}>{(p) => <input name="reason" required minLength={3} maxLength={300} className={inputClass} {...p} />}</Field>
      <ConfirmSubmit state={state} pending={pending} label="Cancel order" confirmLabel={paid ? "Yes, cancel and refund" : "Yes, cancel order"} tone="danger" />
      <Result state={state} />
    </form>
  );
}

export function RefundForm({ orderReference, paymentReference, remainingKobo }: { orderReference: string; paymentReference: string; remainingKobo: number }) {
  // One key per attempt, kept until the refund succeeds, so a retry is replayed by the API instead of refunding twice.
  const attempt = useRef<string | null>(null);
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    attempt.current ??= crypto.randomUUID();
    fd.set("key", attempt.current);
    const result = await refundAction(orderReference, paymentReference, prev, fd);
    if (result.status === "success") attempt.current = null;
    return result;
  }, IDLE);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Field label="Amount in naira (blank = everything left)" hint={`Up to ₦${(remainingKobo / 100).toLocaleString("en-NG")} remains.`} error={fe(state, "amount")}>
        {(p) => <input name="amount" inputMode="decimal" className={inputClass} {...p} />}
      </Field>
      <Field label="Reason" error={fe(state, "reason")}>{(p) => <input name="reason" required minLength={3} maxLength={255} className={inputClass} {...p} />}</Field>
      <ConfirmSubmit state={state} pending={pending} label="Refund" confirmLabel="Yes, send refund" tone="primary" />
      <Result state={state} />
    </form>
  );
}
