"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { verifyPaymentAction } from "@/app/actions/payments";
import { useCart } from "@/components/cart/cart-provider";
import type { ActionError } from "@/lib/api/result";
import type { PaymentInfo } from "@/lib/api/types";
import { pollDelayMs, shouldKeepPolling } from "@/lib/payments/polling";

type View = { kind: "checking" } | { kind: "payment"; payment: PaymentInfo } | { kind: "error"; error: ActionError } | { kind: "timeout"; payment: PaymentInfo | null };

/**
 * Where the gateway sends the customer back to. It deliberately ignores everything in the URL the gateway added
 * (status, transaction ids): it only asks our server, which asks the gateway, and shows the verified answer.
 */
export function PaymentReturn({ reference }: { reference: string }) {
  const { refresh } = useCart();
  const [view, setView] = useState<View>({ kind: "checking" });
  const startedAt = useRef<number | null>(null);
  const attempt = useRef(0);
  // Always points at the latest `check`, so the timer can call it without the callback referring to itself.
  const checkRef = useRef<() => void>(() => {});
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = useRef(true);

  const check = useCallback(async () => {
    let result;
    try {
      result = await verifyPaymentAction(reference);
    } catch {
      result = { ok: false as const, code: "network", message: "We couldn't reach the shop. Check your connection and try again." };
    }
    if (!alive.current) return;

    if (!result.ok) {
      setView({ kind: "error", error: result });
      return;
    }
    const payment = result.payment;
    startedAt.current ??= Date.now();
    const elapsed = Date.now() - startedAt.current;

    if (payment.state === "succeeded") void refresh(); // the purchased lines have left the cart
    if (shouldKeepPolling(payment.state, elapsed)) {
      setView({ kind: "payment", payment });
      timer.current = setTimeout(() => checkRef.current(), pollDelayMs(attempt.current++));
    } else if (payment.state === "pending") {
      setView({ kind: "timeout", payment });
    } else {
      setView({ kind: "payment", payment });
    }
  }, [reference, refresh]);

  useEffect(() => {
    checkRef.current = check;
  }, [check]);

  useEffect(() => {
    alive.current = true;
    startedAt.current = Date.now();
    const first = setTimeout(() => checkRef.current(), 0);
    return () => {
      alive.current = false;
      clearTimeout(first);
      clearTimeout(timer.current);
    };
  }, [check]);

  function retry() {
    startedAt.current = Date.now();
    attempt.current = 0;
    setView({ kind: "checking" });
    void check();
  }

  const orderHref = (ref: string) => `/orders/${ref}`;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12" aria-live="polite">
      {view.kind === "checking" && <Panel title="Confirming your payment…" body="This usually takes a few seconds. Please don't close this page or pay again." spinner />}

      {view.kind === "error" && (
        <Panel
          tone="warn"
          title={view.error.code === "network" ? "We couldn't check your payment" : "We couldn't find that payment"}
          body={view.error.code === "network" ? "Your connection dropped. If you already paid, don't worry: we'll confirm it automatically. Try checking again." : view.error.message}
          actions={view.error.code === "network" ? <button onClick={retry} className="min-h-12 rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">Check again</button> : <Link href="/" className="inline-flex min-h-12 items-center rounded-full border border-burgundy px-6 font-semibold text-accent">Back to the shop</Link>}
        />
      )}

      {view.kind === "timeout" && (
        <Panel
          tone="warn"
          title="Still waiting for confirmation"
          body="We haven't heard back from the payment provider yet. If you completed the payment, we'll confirm your order automatically and email you. You don't need to pay again."
          actions={
            <>
              <button onClick={retry} className="min-h-12 rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">Check again</button>
              {view.payment && <Link href={orderHref(view.payment.order.reference)} className="inline-flex min-h-12 items-center rounded-full border border-burgundy px-6 font-semibold text-accent">View your order</Link>}
            </>
          }
        />
      )}

      {view.kind === "payment" && <Outcome payment={view.payment} orderHref={orderHref(view.payment.order.reference)} />}
    </div>
  );
}

function Outcome({ payment, orderHref }: { payment: PaymentInfo; orderHref: string }) {
  switch (payment.state) {
    case "pending":
      return <Panel title="Confirming your payment…" body={payment.message} spinner />;
    case "succeeded":
      return (
        <Panel
          tone="good"
          title="Payment received. Thank you!"
          body={`Your order ${payment.order.reference} is confirmed. We'll email you the details.`}
          actions={<Link href={orderHref} className="inline-flex min-h-12 items-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">View your order</Link>}
        />
      );
    case "review":
      return (
        <Panel
          tone="warn"
          title="We need to check your payment"
          body={payment.message}
          actions={<Link href={orderHref} className="inline-flex min-h-12 items-center rounded-full border border-burgundy px-6 font-semibold text-accent">View your order</Link>}
        />
      );
    default:
      return (
        <Panel
          tone="bad"
          title={payment.state === "failed" ? "The payment didn't go through" : "The payment wasn't completed"}
          body={`${payment.message} Your items are still reserved for a little while, so you can try again.`}
          actions={<Link href={orderHref} className="inline-flex min-h-12 items-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">Try paying again</Link>}
        />
      );
  }
}

function Panel({ title, body, actions, tone = "neutral", spinner = false }: { title: string; body: string; actions?: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad"; spinner?: boolean }) {
  const border = { neutral: "border-burgundy/15", good: "border-emerald-700", warn: "border-gold", bad: "border-danger" }[tone];
  return (
    <div className={`rounded-2xl border-l-4 bg-white p-6 ${border}`}>
      <h1 className="text-2xl font-semibold text-accent">{title}</h1>
      <p className="mt-2 text-muted">{body}</p>
      {spinner && <div className="mt-5 h-1.5 w-40 animate-pulse rounded-full bg-gold/40" aria-hidden="true" />}
      {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
