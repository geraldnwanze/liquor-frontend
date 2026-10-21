import Image from "next/image";
import { Stars } from "@/components/catalog/stars";
import { getReviews } from "@/lib/api/catalog";
import { formatDate } from "@/lib/format";
import { ReviewForm } from "./review-form";

export async function ReviewsSection({ slug }: { slug: string }) {
  const reviews = await getReviews(slug);
  const summary = reviews?.summary;
  return (
    <section className="mt-16 max-w-3xl border-t border-gold/10 pt-12" aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-2xl text-accent">Customer reviews</h2>

      {summary && summary.count > 0 && summary.average !== null ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div>
            <p className="font-display text-5xl text-ivory">{summary.average.toFixed(1)}</p>
            <Stars rating={{ average: summary.average, count: summary.count }} showCount={false} />
            <p className="mt-1 text-sm text-muted">{summary.count} {summary.count === 1 ? "review" : "reviews"}</p>
          </div>
          <ul className="space-y-1.5 text-sm" aria-label="Ratings breakdown">
            {([5, 4, 3, 2, 1] as const).map((n) => {
              const count = summary.distribution[String(n) as "1"];
              return (
                <li key={n} className="flex items-center gap-3">
                  <span className="w-12 text-muted">{n} {n === 1 ? "star" : "stars"}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                    <span className="block h-full rounded-full bg-gold" style={{ width: `${(count / summary.count) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right text-muted">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-muted">No reviews yet.</p>
      )}

      {reviews && reviews.data.length > 0 && (
        <ul className="mt-8 divide-y divide-gold/10">
          {reviews.data.map((r) => (
            <li key={r.id} className="py-5">
              <Stars rating={{ average: r.rating, count: 1 }} showCount={false} />
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              <p className="mt-1 whitespace-pre-line leading-relaxed text-ivory/75">{r.body}</p>
              {r.photos.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Photos from this customer">
                  {r.photos.map((url, i) => (
                    <li key={url} className="relative size-20 overflow-hidden rounded-lg border border-gold/20 sm:size-24">
                      <Image src={url} alt={`Customer photo ${i + 1} of ${r.photos.length}`} fill sizes="96px" className="object-cover" />
                    </li>
                  ))}
                </ul>
              )}
              {r.reply && (
                <div className="mt-3 rounded-xl border-l-4 border-gold bg-white p-3 text-sm">
                  <p className="font-semibold text-accent">Reply from the shop</p>
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-ivory/75">{r.reply.text}</p>
                </div>
              )}
              <p className="mt-2 text-xs text-muted">
                {r.author} · {formatDate(r.created_at)}
                {r.verified_purchase && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-gold">Verified purchase</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
      {reviews && reviews.meta.last_page > 1 && <p className="mt-4 text-sm text-muted">Showing the {reviews.data.length} most recent of {reviews.meta.total} reviews.</p>}

      <div className="mt-8">
        <ReviewForm slug={slug} />
      </div>
    </section>
  );
}
