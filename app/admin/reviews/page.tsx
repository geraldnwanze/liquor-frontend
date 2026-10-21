import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader, panel } from "@/components/admin/page-header";
import { ReviewActions } from "@/components/admin/review-actions";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminReview } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { LiveFilter } from "@/components/admin/live-filter";

export const metadata: Metadata = { title: "Reviews" };

const STATUSES = [
  ["pending", "Waiting"],
  ["approved", "Published"],
  ["rejected", "Rejected"],
] as const;

export default async function AdminReviews({ searchParams }: PageProps<"/admin/reviews">) {
  await requireStaff("/admin/reviews", "reviews.moderate");
  const raw = (await searchParams).status;
  const status = STATUSES.some(([s]) => s === raw) ? (raw as string) : "pending";
  const { data } = await adminGet<{ data: AdminReview[]; meta: { total: number } }>("/reviews", { status });
  if (!data) return <p role="alert">Reviews could not be loaded.</p>;

  return (
    <>
      <PageHeader title="Reviews" subtitle="Customers who bought a product can review it. Nothing is shown to the public until you approve it." />
      <nav aria-label="Review status" className="mb-5 flex gap-2">
        {STATUSES.map(([value, label]) => (
          <Link key={value} href={`/admin/reviews?status=${value}`} aria-current={status === value ? "page" : undefined} className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${status === value ? "bg-burgundy text-ivory" : "border border-stone-300 bg-white hover:bg-stone-50"}`}>
            {label}
          </Link>
        ))}
      </nav>
      {data.data.length === 0 ? (
        <p className={`${panel} p-8 text-center text-muted`}>Nothing here.</p>
      ) : (
        <>
        <LiveFilter targetId="reviews-list" label="Filter reviews" placeholder="Filter by product, customer or words in the review" />
        <ul id="reviews-list" className="space-y-3">
          {data.data.map((r) => (
            <li key={r.id} data-filter-item data-filter-text={`${r.product?.name ?? ""} ${r.customer?.name ?? ""} ${r.customer?.email ?? ""} ${r.title ?? ""} ${r.body}`} className={`${panel} p-4`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {r.product ? <Link href={`/products/${r.product.slug}`} className="underline underline-offset-4">{r.product.name}</Link> : "Deleted product"}
                  <span className="ml-3 text-amber-700" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </p>
                <p className="text-xs text-muted">{r.customer?.name} · {formatDate(r.created_at)}{r.verified_purchase ? " · verified purchase" : ""}</p>
              </div>
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{r.body}</p>
              {r.photos.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Photos attached to this review">
                  {r.photos.map((url, i) => (
                    <li key={url} className="relative size-20 overflow-hidden rounded-lg border border-stone-200">
                      <Image src={url} alt={`Review photo ${i + 1}`} fill sizes="80px" className="object-cover" />
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">{r.product && <ReviewActions id={r.id} productSlug={r.product.slug} status={r.status} reply={r.reply} />}</div>
            </li>
          ))}
        </ul>
        </>
      )}
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
