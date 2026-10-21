"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getCheckoutPrefillAction, saveAddressAction } from "@/app/actions/account";
import { placeOrderAction } from "@/app/actions/checkout";
import { DiscountBox } from "@/components/cart/discount-box";
import { useCart, forgetSavedCart } from "@/components/cart/cart-provider";
import type { ActionError } from "@/lib/api/result";
import type { Address, DeliveryZone, PublicSettings } from "@/lib/api/types";
import { checkoutBlocker, issueMessage } from "@/lib/cart/messages";
import { Field, inputClass } from "@/components/ui/field";
import { newAttemptKey } from "@/lib/checkout/attempt-key";
import { citiesFor, coverage, findZone, statesFor } from "@/lib/checkout/coverage";
import { normalizeNigerianPhone } from "@/lib/checkout/phone";
import { formatNaira } from "@/lib/money";

interface Fields {
  name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  deliveryInstructions: string;
  ageConfirmed: boolean;
}

const EMPTY: Fields = { name: "", email: "", phone: "", state: "", city: "", address: "", deliveryInstructions: "", ageConfirmed: false };
const AREA_KEY = "lq:checkout-area";

const input = inputClass;

export function CheckoutExperience({ zones, settings }: { zones: DeliveryZone[]; settings: PublicSettings }) {
  const router = useRouter();
  const { cart, loading, stale, online, refresh } = useCart();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<ActionError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [saved, setSaved] = useState<Address[]>([]);
  const [saveAddress, setSaveAddress] = useState(false);
  const [pickedAddress, setPickedAddress] = useState<string | null>(null);
  // One idempotency key per distinct submission: reused when retrying unchanged details, renewed on any edit.
  // Created lazily (never during render, or the prerendered page would share one key between all visitors).
  const attemptKey = useRef<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const cityListId = useId();

  // Only the (non-personal) delivery area is remembered, in this tab only, so an interrupted checkout resumes.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(AREA_KEY) ?? "null") as { state?: string; city?: string } | null;
        if (saved?.state) setFields((f) => ({ ...f, state: String(saved.state), city: String(saved.city ?? "") }));
      } catch {
        /* ignore */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Signed-in customers: fill in their details and offer saved addresses. Guests are never asked to sign in.
  useEffect(() => {
    if (!document.cookie.split("; ").includes("lq_has_session=1")) return;
    let active = true;
    getCheckoutPrefillAction()
      .then((data) => {
        if (!active || !data) return;
        setSignedIn(true);
        setSaved(data.addresses);
        setFields((f) => ({ ...f, name: f.name || data.user.name, email: f.email || data.user.email, phone: f.phone || data.user.phone || "" }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  function chooseSavedAddress(id: string | null) {
    setPickedAddress(id);
    const a = saved.find((x) => x.id === id);
    if (!a) return;
    setFields((f) => ({ ...f, name: a.recipient_name, phone: a.phone, state: a.state, city: a.city, address: a.address_line, deliveryInstructions: a.instructions ?? "" }));
    attemptKey.current = null;
  }

  const zone = useMemo(() => findZone(zones, fields.state, fields.city), [zones, fields.state, fields.city]);
  const area = coverage(zones, fields.state, fields.city);
  const phoneNormalized = normalizeNigerianPhone(fields.phone);

  // Ask the server for the real delivery fee for this address (debounced). Display only: it is recomputed at checkout.
  useEffect(() => {
    if (area !== "covered" || !online) return;
    const t = setTimeout(() => void refresh({ state: fields.state, city: fields.city }), 400);
    return () => clearTimeout(t);
  }, [area, online, fields.state, fields.city, refresh]);

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => {
      const next = { ...f, [key]: value };
      if (key === "state" || key === "city") {
        try {
          sessionStorage.setItem(AREA_KEY, JSON.stringify({ state: next.state, city: next.city }));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
    attemptKey.current = null;
    setServerErrors((e) => (e[key] || e[toApiField(key)] ? { ...e, [key]: [], [toApiField(key)]: [] } : e));
  }

  const blocker = checkoutBlocker(cart, online && !stale);
  const clientErrors: Partial<Record<keyof Fields, string>> = {
    name: fields.name.trim().length < 2 ? "Enter your full name." : undefined,
    email: !/^\S+@\S+\.\S+$/.test(fields.email) ? "Enter a valid email address." : undefined,
    phone: !phoneNormalized ? "Enter a valid Nigerian mobile number, e.g. 0803 123 4567." : undefined,
    state: !fields.state ? "Choose your state." : undefined,
    city: !fields.city.trim() ? "Enter your city or area." : area === "not_covered" ? `We don't deliver to ${fields.city}, ${fields.state} yet.` : undefined,
    address: fields.address.trim().length < 5 ? "Enter your street address." : undefined,
    ageConfirmed: !fields.ageConfirmed ? `You must confirm you are at least ${settings.commerce.minimum_age} years old.` : undefined,
  };
  const hasClientErrors = Object.values(clientErrors).some(Boolean);

  const errorFor = (key: keyof Fields): string | undefined => serverErrors[toApiField(key)]?.[0] ?? serverErrors[key]?.[0] ?? (touched[key] ? clientErrors[key] : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setTouched({ name: true, email: true, phone: true, state: true, city: true, address: true, ageConfirmed: true });
    if (blocker || hasClientErrors) {
      focusFirstProblem();
      return;
    }

    attemptKey.current ??= newAttemptKey();
    setSubmitting(true);
    let result;
    try {
      result = await placeOrderAction({ idempotencyKey: attemptKey.current, ...fields, phone: phoneNormalized ?? fields.phone });
    } catch {
      result = { ok: false as const, code: "network", message: "Connection lost." };
    }
    setSubmitting(false);

    if (result.ok) {
      if (signedIn && saveAddress && pickedAddress === null) {
        // Best effort: never let this block or fail the order.
        const fd = new FormData();
        fd.set("recipient_name", fields.name);
        fd.set("phone", fields.phone);
        fd.set("state", fields.state);
        fd.set("city", fields.city);
        fd.set("address_line", fields.address);
        fd.set("instructions", fields.deliveryInstructions);
        await saveAddressAction({ status: "idle" }, fd).catch(() => null);
      }
      forgetSavedCart();
      void refresh(); // the cart is kept server-side until paid; show its current state
      router.push(`/orders/${result.order.reference}`);
      return;
    }

    setFormError(result);
    setServerErrors(result.fieldErrors ?? (result.code === "age_not_verified" ? { age_confirmed: [result.message] } : result.code === "delivery_unavailable" ? { city: [result.message] } : {}));
    // A discount code can stop working between applying it and placing the order; reload the cart to show the truth.
    if (result.code === "cart_has_issues" || result.code === "insufficient_stock" || result.code.startsWith("discount_")) void refresh({ state: fields.state, city: fields.city });
    if (result.code === "idempotency_key_reused") attemptKey.current = null;
    requestAnimationFrame(() => errorRef.current?.focus());
  }

  function focusFirstProblem() {
    requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
  }

  if (loading && cart.items.length === 0) {
    return (
      <p role="status" className="py-16 text-center text-muted">
        Loading your cart…
      </p>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-semibold text-accent">Your cart is empty</h2>
        <p className="mt-2 text-muted">Add something to your cart to check out.</p>
        <Link href="/" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">
          Continue shopping
        </Link>
      </div>
    );
  }

  const delivery = cart.delivery;
  const subtotal = cart.subtotal.kobo;
  const discountKobo = cart.discount?.applied ? cart.discount.amount.kobo : 0;
  const estimatedTotal = delivery ? subtotal - discountKobo + delivery.fee.kobo : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <form onSubmit={submit} noValidate className="space-y-8" aria-describedby={formError ? "form-error" : undefined}>
        {(!online || stale) && (
          <p role="alert" className="rounded-lg border-l-4 border-danger bg-white p-3 text-sm">
            You&apos;re offline. Checkout needs an internet connection so we can confirm stock, prices and delivery. Your delivery area is kept for when you&apos;re back; nothing is submitted automatically.
          </p>
        )}

        {formError && (
          <div id="form-error" ref={errorRef} tabIndex={-1} role="alert" className="rounded-lg border-l-4 border-danger bg-white p-4 text-sm">
            <p className="font-medium text-danger">{errorHeadline(formError)}</p>
            <p className="mt-1">{formError.message}</p>
            {formError.code === "network" && <p className="mt-1 text-muted">Your details are still here. Trying again is safe: it can&apos;t create a second order.</p>}
            {formError.code === "cart_has_issues" && <p className="mt-1 text-muted">We&apos;ve updated your cart below. Review it and try again.</p>}
            {formError.code.startsWith("discount_") && <p className="mt-1 text-muted">No order was placed and you haven&apos;t been charged. Check the code in your order summary, then try again.</p>}
          </div>
        )}

        {!signedIn && (
          <p className="text-sm text-muted">
            Have an account?{" "}
            <Link href="/login?next=/checkout" className="font-medium text-accent underline underline-offset-4">
              Sign in
            </Link>{" "}
            to use your saved details, or just continue as a guest.
          </p>
        )}
        {signedIn && saved.length > 0 && (
          <Field label="Deliver to a saved address">
            {(p) => (
              <select {...p} value={pickedAddress ?? ""} onChange={(e) => chooseSavedAddress(e.target.value || null)} className={input}>
                <option value="">Enter a new address</option>
                {saved.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label ? `${a.label}: ` : ""}
                    {a.address_line}, {a.city}
                    {a.is_default ? " (default)" : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-accent">Contact</legend>
          <Field label="Full name" error={errorFor("name")}>
            {(p) => <input {...p} name="name" autoComplete="name" required value={fields.name} onChange={(e) => update("name", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} className={input} />}
          </Field>
          <Field label="Email" error={errorFor("email")} hint="We'll send your order confirmation here.">
            {(p) => <input {...p} name="email" type="email" autoComplete="email" required value={fields.email} onChange={(e) => update("email", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} className={input} />}
          </Field>
          <Field label="Mobile number" error={errorFor("phone")} hint="For delivery updates. e.g. 0803 123 4567">
            {(p) => <input {...p} name="phone" type="tel" inputMode="tel" autoComplete="tel" required value={fields.phone} onChange={(e) => update("phone", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} className={input} />}
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-accent">Delivery</legend>
          {zones.length === 0 ? (
            <p role="alert" className="rounded-lg bg-white p-3 text-sm">We aren&apos;t taking delivery orders right now. Please check back soon.</p>
          ) : (
            <>
              <Field label="State" error={errorFor("state")}>
                {(p) => (
                  <select {...p} name="state" autoComplete="address-level1" required value={fields.state} onChange={(e) => update("state", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, state: true }))} className={input}>
                    <option value="">Select your state</option>
                    {statesFor(zones).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="City or area" error={errorFor("city")}>
                {(p) => (
                  <>
                    <input {...p} name="city" autoComplete="address-level2" list={cityListId} required value={fields.city} onChange={(e) => update("city", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, city: true }))} className={input} />
                    <datalist id={cityListId}>
                      {citiesFor(zones, fields.state).map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </>
                )}
              </Field>
              {area === "covered" && zone && (
                <p role="status" className="text-sm text-emerald-400">
                  We deliver to {fields.city}, {fields.state}
                  {zone.estimate ? ` · ${zone.estimate}` : ""}
                  {zone.free_threshold ? ` · free delivery over ${zone.free_threshold.formatted}` : ""}
                </p>
              )}
              <Field label="Street address" error={errorFor("address")}>
                {(p) => <input {...p} name="address" autoComplete="address-line1" required value={fields.address} onChange={(e) => update("address", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, address: true }))} className={input} />}
              </Field>
              <Field label="Delivery instructions (optional)" error={serverErrors.delivery_instructions?.[0]}>
                {(p) => <textarea {...p} name="delivery_instructions" rows={3} maxLength={500} value={fields.deliveryInstructions} onChange={(e) => update("deliveryInstructions", e.target.value)} className={input} />}
              </Field>
              {signedIn && pickedAddress === null && (
                <label className="flex min-h-11 items-center gap-3">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-5 accent-[#d6b36c]" />
                  <span className="text-sm">Save this address to my account</span>
                </label>
              )}
            </>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-lg font-semibold text-accent">Age confirmation</legend>
          <label className="flex min-h-11 items-start gap-3">
            <input
              type="checkbox"
              checked={fields.ageConfirmed}
              onChange={(e) => update("ageConfirmed", e.target.checked)}
              onBlur={() => setTouched((t) => ({ ...t, ageConfirmed: true }))}
              aria-invalid={Boolean(errorFor("ageConfirmed"))}
              aria-describedby="age-help"
              className="mt-1 size-5 accent-[#d6b36c]"
            />
            <span>I confirm I am at least {settings.commerce.minimum_age} years old and legally allowed to buy alcohol.</span>
          </label>
          <p id="age-help" className={`text-sm ${errorFor("ageConfirmed") ? "text-danger" : "text-muted"}`}>
            {errorFor("ageConfirmed") ?? "Our driver may ask for ID on delivery."}
          </p>
        </fieldset>

        <div>
          <button type="submit" disabled={submitting || Boolean(blocker) || zones.length === 0} className="min-h-12 w-full rounded-full bg-gold px-6 font-semibold text-midnight disabled:cursor-not-allowed disabled:opacity-50 transition hover:bg-[#dcb86e]">
            {submitting ? "Placing your order…" : "Place order"}
          </button>
          <p className="mt-2 text-sm text-muted" role="status">
            {blocker ?? `We'll hold your items for ${settings.commerce.reservation_minutes} minutes while you pay.`}
          </p>
        </div>
      </form>

      <aside aria-label="Order summary" className="h-fit rounded-2xl border border-burgundy/15 bg-white p-4 lg:sticky lg:top-4">
        <h2 className="text-lg font-semibold text-accent">Order summary</h2>
        <ul className="mt-3 divide-y divide-burgundy/10">
          {cart.items.map((item) => (
            <li key={item.id} className="py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span>
                  {item.product.name} <span className="text-muted">· {item.variant.name} × {item.quantity}</span>
                </span>
                <span className="font-medium">{item.issues.includes("unavailable") ? "" : item.line_total.formatted}</span>
              </div>
              {item.price_changed_from && <p className="text-xs text-accent">Price changed (was {item.price_changed_from.formatted})</p>}
              {item.issues.map((issue) => (
                <p key={issue} className="text-xs text-danger">
                  {issueMessage(issue)}
                </p>
              ))}
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-burgundy/10 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{cart.subtotal.formatted}</dd>
          </div>
          {discountKobo > 0 && (
            <div className="flex justify-between">
              <dt>Discount ({cart.discount?.code})</dt>
              <dd>-{cart.discount?.amount.formatted}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>
              {delivery ? (
                delivery.fee.kobo === 0 ? (
                  <>
                    {delivery.fee_waived && <s className="mr-1 text-muted">{delivery.fee_waived.formatted}</s>}Free
                  </>
                ) : (
                  delivery.fee.formatted
                )
              ) : (
                "Enter your address"
              )}
            </dd>
          </div>
          <div className="flex justify-between border-t border-burgundy/10 pt-2 text-base font-semibold">
            <dt>{estimatedTotal === null ? "Total" : "Estimated total"}</dt>
            <dd>{estimatedTotal === null ? cart.subtotal.formatted : formatNaira(estimatedTotal)}</dd>
          </div>
        </dl>
        <div className="mt-3">
          <DiscountBox delivery={fields.state && fields.city ? { state: fields.state, city: fields.city } : undefined} />
        </div>
        <p className="mt-3 text-xs text-muted">Final prices, delivery fee and stock are confirmed by our system when you place your order.</p>
        {cart.has_issues && (
          <p role="alert" className="mt-3 text-sm text-danger">
            Some items need attention. Open your cart to fix them.
          </p>
        )}
      </aside>
    </div>
  );
}

/** Laravel validates snake_case names; our form state is camelCase. */
function toApiField(key: string): string {
  return key === "deliveryInstructions" ? "delivery_instructions" : key === "ageConfirmed" ? "age_confirmed" : key;
}

function errorHeadline(error: ActionError): string {
  switch (error.code) {
    case "network":
      return "Connection problem";
    case "cart_has_issues":
    case "insufficient_stock":
      return "Your cart changed";
    case "delivery_unavailable":
      return "We can't deliver there yet";
    case "age_not_verified":
      return "Age confirmation needed";
    case "order_limit":
      return "Order limit reached";
    case "rate_limited":
      return "Too many attempts";
    default:
      return "We couldn't place your order";
  }
}
