import Link from "next/link";
import { PrintButton } from "@/components/orders/print-button";
import type { Receipt } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import Image from "next/image";

/** The printable receipt. Used for customers and for staff, so both always see the same document. */
export function ReceiptDocument({ receipt, backHref, backLabel }: { receipt: Receipt; backHref: string; backLabel: string }) {
  const b = receipt.business;
  return (
    <article className="rounded-2xl border border-burgundy/15 bg-white p-6 print:rounded-none print:border-0" aria-labelledby="receipt-title">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-burgundy/15 pb-4">
        <div>
          {b.logo_url && <Image src={b.logo_url} alt="" width={200} height={80} className="mb-2 h-14 w-auto max-w-[12rem] object-contain" />}
          <p className="text-xl font-semibold text-accent">{b.name}</p>
          {b.address && <p className="text-sm text-muted">{b.address}</p>}
          {(b.phone || b.email) && <p className="text-sm text-muted">{[b.phone, b.email].filter(Boolean).join(" · ")}</p>}
          {b.registration_number && <p className="text-sm text-muted">Reg. no. {b.registration_number}</p>}
        </div>
        <div className="text-right text-sm">
          <h1 id="receipt-title" className="text-2xl font-semibold text-accent">{receipt.status === "cancelled" ? "Receipt (cancelled)" : "Receipt"}</h1>
          <p>No. {receipt.number}</p>
          <p className="text-muted">{formatDate(receipt.issued_at)}</p>
        </div>
      </header>

      <section className="mt-4 grid gap-4 text-sm sm:grid-cols-2" aria-label="Customer and delivery">
        <div>
          <h2 className="font-semibold">Billed to</h2>
          <p>{receipt.customer.name}</p>
          <p className="text-muted">{receipt.customer.email}</p>
        </div>
        <div>
          <h2 className="font-semibold">Delivered to</h2>
          <p>{receipt.delivery.address}</p>
          <p className="text-muted">{receipt.delivery.city}, {receipt.delivery.state}</p>
        </div>
      </section>

      <table className="mt-5 w-full text-sm">
        <caption className="sr-only">Items</caption>
        <thead>
          <tr className="border-b border-burgundy/15 text-left text-muted">
            <th scope="col" className="py-2 font-medium">Item</th>
            <th scope="col" className="py-2 text-right font-medium">Qty</th>
            <th scope="col" className="py-2 text-right font-medium">Price</th>
            <th scope="col" className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item) => (
            <tr key={item.sku} className="border-b border-burgundy/10">
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{item.unit_price.formatted}</td>
              <td className="py-2 text-right">{item.line_total.formatted}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{receipt.subtotal.formatted}</dd></div>
        {receipt.discount.kobo > 0 && <div className="flex justify-between"><dt>Discount{receipt.discount_code ? ` (${receipt.discount_code})` : ""}</dt><dd>−{receipt.discount.formatted}</dd></div>}
        <div className="flex justify-between"><dt>Delivery</dt><dd>{receipt.delivery_fee.kobo === 0 ? "Free" : receipt.delivery_fee.formatted}</dd></div>
        <div className="flex justify-between border-t border-burgundy/15 pt-2 text-base font-semibold"><dt>Total paid</dt><dd>{receipt.total.formatted}</dd></div>
        {receipt.refunded.kobo > 0 && <div className="flex justify-between text-accent"><dt>Refunded</dt><dd>{receipt.refunded.formatted}</dd></div>}
      </dl>

      {receipt.payment && (
        <p className="mt-5 text-sm text-muted">
          Paid by {receipt.payment.method}. Payment reference {receipt.payment.reference}.
        </p>
      )}
      {receipt.footer && <p className="mt-4 border-t border-burgundy/10 pt-3 text-sm text-muted">{receipt.footer}</p>}

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <PrintButton />
        <Link href={backHref} className="inline-flex min-h-12 items-center rounded-full border border-burgundy px-6 font-semibold text-accent">{backLabel}</Link>
      </div>
    </article>
  );
}
