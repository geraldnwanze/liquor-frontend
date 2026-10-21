"use client";

import { useState } from "react";
import { startPaymentAction } from "@/app/actions/payments";
import { useOnlineStatus } from "@/lib/pwa/use-online-status";
import type { PaymentGateway } from "@/lib/api/types";
import { safeGatewayUrl } from "@/lib/payments/gateway-url";

/**
 * "Pay now" for an unpaid order. Sends the customer to the gateway's own page, which is where card details are
 * entered: they never touch this site or our servers. Needs a live connection, and nothing is retried automatically.
 */
export function PayPanel({ orderReference, totalFormatted, gateways }: { orderReference: string; totalFormatted: string; gateways: PaymentGateway[] }) {
  const online = useOnlineStatus();
  const [gateway, setGateway] = useState(gateways[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (gateways.length === 0) {
    return (
      <p role="status" className="mt-4 rounded-lg border-l-4 border-gold bg-white p-3 text-sm">
        Online payment isn&apos;t available right now. Your items stay reserved for a short while; please try again shortly.
      </p>
    );
  }

  async function pay() {
    setError(null);
    setPending(true);
    let result;
    try {
      result = await startPaymentAction(orderReference, gateway);
    } catch {
      result = { ok: false as const, code: "network", message: "We couldn't reach the shop. Check your connection and try again." };
    }

    if (!result.ok) {
      setPending(false);
      setError(result.message);
      return;
    }
    const destination = safeGatewayUrl(result.payment.authorization_url, window.location.origin);
    if (!destination) {
      setPending(false);
      setError("We couldn't open the payment page. Please try again.");
      return;
    }
    // Leaving for the gateway. `pending` stays true so the button can't be pressed twice meanwhile.
    window.location.assign(destination);
  }

  return (
    <section className="mt-4 rounded-2xl border border-burgundy/15 bg-white p-4" aria-labelledby="pay-heading">
      <h2 id="pay-heading" className="text-lg font-semibold text-accent">
        Pay for this order
      </h2>

      {gateways.length > 1 && (
        <fieldset className="mt-3">
          <legend className="text-sm font-medium">Payment method</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {gateways.map((g) => (
              <label key={g.id} className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${g.id === gateway ? "border-burgundy bg-gold text-midnight" : "border-ink/40"}`}>
                <input type="radio" name="gateway" value={g.id} checked={g.id === gateway} onChange={() => setGateway(g.id)} className="sr-only" />
                {g.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="button"
        onClick={pay}
        disabled={pending || !online}
        className="mt-4 min-h-12 w-full rounded-full bg-gold px-6 font-semibold text-midnight disabled:cursor-not-allowed disabled:opacity-50 transition hover:bg-[#dcb86e]"
      >
        {pending ? "Opening the payment page…" : `Pay ${totalFormatted}`}
      </button>
      <p className="mt-2 text-xs text-muted">
        {online ? "You'll be taken to the payment provider's secure page. We never see or store your card details." : "You're offline. Paying needs an internet connection."}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
