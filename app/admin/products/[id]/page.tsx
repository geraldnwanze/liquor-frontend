import { isUuid } from "@/lib/ids";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImagesPanel } from "@/components/admin/images-panel";
import { PageHeader, panel } from "@/components/admin/page-header";
import { ProductActions } from "@/components/admin/product-actions";
import { ProductForm } from "@/components/admin/product-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { AddVariant, VariantsPanel } from "@/components/admin/variants-panel";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminProduct, StockMovement } from "@/lib/api/types";
import { can } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Edit product" };

const card = `${panel} p-5`;
const heading = "text-sm font-semibold uppercase tracking-wider text-muted";

export default async function AdminProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const user = await requireStaff(`/admin/products/${id}`, "catalog.manage");
  if (!isUuid(id)) notFound();
  const rawHistory = (await searchParams).history;
  const history = isUuid(rawHistory) ? rawHistory : null;

  const [res, brands, cats] = await Promise.all([
    adminGet<{ data: AdminProduct }>(`/products/${id}`),
    adminGet<{ data: { id: string; name: string }[] }>("/brands"),
    adminGet<{ data: { id: string; name: string; parent_id: string | null }[] }>("/categories"),
  ]);
  if (!res.data) notFound();
  const p = res.data.data;
  const variants = p.variants ?? [];
  const canStock = can(user, "inventory.manage");
  const canCost = can(user, "catalog.view-cost");
  const historyVariant = canStock ? variants.find((v) => v.id === history) : undefined;
  const movements = historyVariant ? (await adminGet<{ data: StockMovement[] }>(`/variants/${historyVariant.id}/movements`)).data?.data ?? [] : [];

  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><span aria-hidden="true">←</span> All products</Link>
      <PageHeader title={p.name} subtitle={`/${p.slug}${p.is_demo ? " · demo product" : ""}`}>
        <StatusBadge kind="product" value={p.status} />
      </PageHeader>

      <div className="space-y-6">
        <section className={card} aria-labelledby="details"><h2 id="details" className={`${heading} mb-4`}>Details</h2><ProductForm product={p} brands={brands.data?.data ?? []} categories={cats.data?.data ?? []} /></section>

        <section id="variants" className={card} aria-labelledby="variants-h">
          <h2 id="variants-h" className={`${heading} mb-2`}>Variants and stock</h2>
          <VariantsPanel productId={p.id} variants={variants} canSeeCost={canCost} canAdjustStock={canStock} historyVariantId={historyVariant?.id ?? null} />
          <div className="mt-4"><AddVariant productId={p.id} canSeeCost={canCost} /></div>
          {historyVariant && (
            <div className="mt-6 border-t border-stone-200 pt-4">
              <h3 className="text-sm font-semibold">Stock history: {historyVariant.name}</h3>
              <ul className="mt-3 divide-y divide-stone-100 text-sm">
                {movements.map((m) => (
                  <li key={m.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span><span className={`font-semibold tabular-nums ${m.delta < 0 ? "text-red-700" : "text-emerald-800"}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span> <span className="capitalize">{m.reason.replaceAll("_", " ")}</span>{m.note && <span className="text-muted"> · {m.note}</span>}</span>
                    <span className="text-xs text-muted">now {m.on_hand_after} · {formatDateTime(m.created_at)}{m.by ? ` · ${m.by.name}` : ""}</span>
                  </li>
                ))}
                {movements.length === 0 && <li className="py-2 text-muted">No movements yet.</li>}
              </ul>
            </div>
          )}
        </section>

        <section className={card} aria-labelledby="images-h"><h2 id="images-h" className={`${heading} mb-2`}>Images</h2><ImagesPanel productId={p.id} images={p.images ?? []} /></section>

        <section className={card} aria-labelledby="more-h"><h2 id="more-h" className={`${heading} mb-4`}>More</h2><ProductActions id={p.id} status={p.status} /></section>
      </div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
