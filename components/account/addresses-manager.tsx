"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState, useTransition } from "react";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "@/app/actions/account";
import { FormError, SubmitButton, fieldError } from "@/components/auth/form-parts";
import { Field, inputClass } from "@/components/ui/field";
import type { Address, DeliveryZone } from "@/lib/api/types";
import { IDLE } from "@/lib/auth/form-state";
import { citiesFor, statesFor } from "@/lib/checkout/coverage";

type Editing = Address | "new" | null;

export function AddressesManager({ addresses, zones }: { addresses: Address[]; zones: DeliveryZone[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ status: string; message?: string }>) {
    startTransition(async () => {
      const result = await task();
      setNotice(result.message ?? null);
      setConfirmingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <p role="status" className="min-h-5 text-sm text-emerald-400">
        {notice}
      </p>

      {addresses.length === 0 && editing !== "new" && (
        <div className="rounded-2xl border border-dashed border-ink/40 p-8 text-center">
          <p className="font-medium">No saved addresses yet</p>
          <p className="mt-1 text-sm text-muted">Save an address to fill in checkout faster.</p>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-2xl border border-burgundy/15 bg-white p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-accent">{a.label || "Address"}</p>
              {a.is_default && <span className="rounded-full bg-gold/25 px-2.5 py-1 text-xs font-medium">Default</span>}
            </div>
            <p className="mt-2">{a.recipient_name}</p>
            <p>{a.address_line}</p>
            <p>
              {a.city}, {a.state}
            </p>
            <p className="text-muted">{a.phone}</p>
            {a.instructions && <p className="mt-1 text-muted">{a.instructions}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={() => setEditing(a)} className="min-h-11 rounded-full border border-burgundy px-4 font-medium text-accent">
                Edit
              </button>
              {!a.is_default && (
                <button disabled={pending} onClick={() => run(() => setDefaultAddressAction(a.id))} className="min-h-11 rounded-full px-3 font-medium text-accent underline underline-offset-4 disabled:opacity-50">
                  Make default
                </button>
              )}
              {confirmingId === a.id ? (
                <span className="flex items-center gap-2">
                  <button disabled={pending} onClick={() => run(() => deleteAddressAction(a.id))} className="min-h-11 rounded-full bg-gold px-4 font-semibold text-midnight disabled:opacity-50 transition hover:bg-[#dcb86e]">
                    Yes, remove
                  </button>
                  <button onClick={() => setConfirmingId(null)} className="min-h-11 px-3">
                    Keep
                  </button>
                </span>
              ) : (
                <button onClick={() => setConfirmingId(a.id)} className="min-h-11 px-3 text-accent underline underline-offset-4">
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <AddressForm
          key={editing === "new" ? "new" : editing.id}
          address={editing === "new" ? null : editing}
          zones={zones}
          onDone={(message) => {
            setEditing(null);
            setNotice(message);
            router.refresh();
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        addresses.length < 10 && (
          <button onClick={() => setEditing("new")} className="min-h-12 rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">
            Add an address
          </button>
        )
      )}
    </div>
  );
}

function AddressForm({ address, zones, onDone, onCancel }: { address: Address | null; zones: DeliveryZone[]; onDone: (message: string) => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState(saveAddressAction, IDLE);
  const [stateName, setStateName] = useState(address?.state ?? "");
  const cityList = useId();

  useEffect(() => {
    if (state.status === "success") onDone(state.message ?? "Address saved.");
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-burgundy/15 bg-white p-5" aria-label={address ? "Edit address" : "Add an address"}>
      <h2 className="text-lg font-semibold text-accent">{address ? "Edit address" : "Add an address"}</h2>
      {address && <input type="hidden" name="id" value={address.id} />}
      <FormError state={state} />
      <Field label="Label (optional)" error={fieldError(state, "label")} hint="e.g. Home, Office">
        {(p) => <input {...p} name="label" maxLength={40} defaultValue={address?.label ?? ""} className={inputClass} />}
      </Field>
      <Field label="Recipient name" error={fieldError(state, "recipient_name")}>
        {(p) => <input {...p} name="recipient_name" autoComplete="name" required defaultValue={address?.recipient_name ?? ""} className={inputClass} />}
      </Field>
      <Field label="Mobile number" error={fieldError(state, "phone")}>
        {(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel" required defaultValue={address?.phone ?? ""} className={inputClass} />}
      </Field>
      <Field label="State" error={fieldError(state, "state")}>
        {(p) => (
          <select {...p} name="state" required value={stateName} onChange={(e) => setStateName(e.target.value)} className={inputClass}>
            <option value="">Select your state</option>
            {statesFor(zones).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="City or area" error={fieldError(state, "city")}>
        {(p) => (
          <>
            <input {...p} name="city" list={cityList} autoComplete="address-level2" required defaultValue={address?.city ?? ""} className={inputClass} />
            <datalist id={cityList}>
              {citiesFor(zones, stateName).map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </>
        )}
      </Field>
      <Field label="Street address" error={fieldError(state, "address_line")}>
        {(p) => <input {...p} name="address_line" autoComplete="address-line1" required defaultValue={address?.address_line ?? ""} className={inputClass} />}
      </Field>
      <Field label="Delivery instructions (optional)" error={fieldError(state, "instructions")}>
        {(p) => <textarea {...p} name="instructions" rows={2} maxLength={500} defaultValue={address?.instructions ?? ""} className={inputClass} />}
      </Field>
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="is_default" defaultChecked={address?.is_default ?? false} disabled={address?.is_default} className="size-5 accent-[#d6b36c]" />
        <span className="text-sm">{address?.is_default ? "This is your default address" : "Use as my default address"}</span>
      </label>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-40 flex-1 sm:flex-none">
          <SubmitButton pending={pending} pendingText="Saving…">
            Save address
          </SubmitButton>
        </div>
        <button type="button" onClick={onCancel} className="min-h-12 rounded-full px-6 font-medium text-accent">
          Cancel
        </button>
      </div>
    </form>
  );
}
