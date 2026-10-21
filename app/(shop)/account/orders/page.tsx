import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/catalog/pagination";
import { getMyOrders, requireUser } from "@/lib/api/account";
import { orderStatusLabel, orderStatusTone } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const raw = (await searchParams).page;
  const page = Math.min(500, Math.max(1, Number(Array.isArray(raw) ? raw[0] : raw) || 1));
  await requireUser("/account/orders");
  const orders = await getMyOrders(page);
  const date = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" });

  return (
    <section aria-labelledby="orders-heading">
      <h2 id="orders-heading" className="text-2xl font-semibold text-accent">
        Your orders
      </h2>

      {!orders || orders.data.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink/40 p-10 text-center">
          <p className="font-medium">You haven&apos;t placed any orders yet</p>
          <Link href="/" className="mt-4 inline-flex min-h-12 items-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">
            Start shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-3">
            {orders.data.map((order) => {
              const units = order.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <li key={order.reference} className="relative rounded-2xl border border-burgundy/15 bg-white p-4 hover:border-burgundy/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-accent">
                      {/* Stretched link: the whole card is one tap target. */}
                      <Link href={`/account/orders/${order.reference}`} className="after:absolute after:inset-0">
                        Order {order.reference}
                      </Link>
                    </p>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${orderStatusTone(order.status)}`}>{orderStatusLabel(order.status)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {date.format(new Date(order.created_at))} · {units} {units === 1 ? "item" : "items"}
                  </p>
                  <p className="mt-1 font-semibold">{order.total.formatted}</p>
                </li>
              );
            })}
          </ul>
          <Pagination basePath="/account/orders" params={{}} current={orders.meta.current_page} last={orders.meta.last_page} />
        </>
      )}
    </section>
  );
}
