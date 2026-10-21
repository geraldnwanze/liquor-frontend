import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteDiscountButton } from "@/components/admin/delete-discount-button";
import { DiscountForm } from "@/components/admin/discount-form";
import { PageHeader, panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminDiscount } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { isUuid } from "@/lib/ids";

export const metadata: Metadata = { title: "Edit discount" };

const card = `${panel} p-5`;
const heading = "text-sm font-semibold uppercase tracking-wider text-muted";

export default async function AdminDiscountPage({ params }: PageProps<"/admin/discounts/[id]">) {
  const { id } = await params;
  await requireStaff(`/admin/discounts/${id}`, "promotions.manage");
  if (!isUuid(id)) notFound();
  const [res, targets] = await Promise.all([
    adminGet<{ data: AdminDiscount }>(`/discounts/${id}`),
    adminGet<{ data: { categories: { id: string; name: string; parent_id: string | null }[] } }>("/discounts/targets"),
  ]);
  if (!res.data) notFound();
  const d = res.data.data;

  return (
    <>
      <Link href="/admin/discounts" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><span aria-hidden="true">←</span> All discounts</Link>
      <PageHeader title={d.code} subtitle={d.name}><StatusBadge kind="discount" value={d.status} /></PageHeader>

      <div className="space-y-6">
        <section className={card} aria-labelledby="usage-h">
          <h2 id="usage-h" className={`${heading} mb-3`}>Usage</h2>
          <dl className="grid gap-4 sm:grid-cols-4">
            <div><dt className="text-xs text-muted">Uses (paid or awaiting payment)</dt><dd className="text-2xl font-semibold tabular-nums">{d.uses}{d.usage_limit ? <span className="text-base font-normal text-muted"> / {d.usage_limit}</span> : null}</dd></div>
            <div><dt className="text-xs text-muted">Taken off paid orders</dt><dd className="text-2xl font-semibold tabular-nums">{d.given?.formatted ?? "₦0"}</dd></div>
            <div><dt className="text-xs text-muted">Delivery waived (paid)</dt><dd className="text-2xl font-semibold tabular-nums">{d.delivery_waived?.formatted ?? "₦0"}</dd></div>
          </dl>
          {(d.recent_redemptions ?? []).length > 0 && (
            <ul className="mt-4 divide-y divide-stone-100 border-t border-stone-200 text-sm">
              {d.recent_redemptions!.map((r, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{r.order ? <Link href={`/admin/orders/${r.order}`} className="font-mono text-[13px] text-burgundy hover:underline">{r.order}</Link> : "Order"} <span className="text-muted">· {r.email}</span></span>
                  <span className="text-muted">{r.state} · {r.amount.kobo > 0 ? r.amount.formatted : r.delivery_waived.kobo > 0 ? `${r.delivery_waived.formatted} delivery` : "-"} · {formatDateTime(r.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card} aria-labelledby="edit-h"><h2 id="edit-h" className={`${heading} mb-4`}>Settings</h2><DiscountForm discount={d} categories={targets.data?.data.categories ?? []} /></section>

        <section className={card} aria-labelledby="del-h">
          <h2 id="del-h" className={`${heading} mb-2`}>Delete</h2>
          <p className="mb-3 text-sm text-muted">A code that has been used on an order can&apos;t be deleted because it is part of order history. Switch it off above instead.</p>
          <DeleteDiscountButton id={d.id} />
        </section>
      </div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
