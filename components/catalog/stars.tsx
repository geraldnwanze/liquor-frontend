import type { Rating } from "@/lib/api/types";

function Star({ fill }: { fill: number }) {
  return (
    <span className="relative inline-block size-4" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-4 text-gold/30" fill="currentColor"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" /></svg>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${Math.round(fill * 100)}%` }}>
        <svg viewBox="0 0 24 24" className="size-4 text-gold" fill="currentColor"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" /></svg>
      </span>
    </span>
  );
}

/** Star row for an average. Read out as text ("Rated 4.5 out of 5 from 12 reviews") for screen readers. */
export function Stars({ rating, showCount = true }: { rating: Rating; showCount?: boolean }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted">
      <span className="sr-only">
        Rated {rating.average} out of 5 from {rating.count} {rating.count === 1 ? "review" : "reviews"}
      </span>
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} fill={Math.max(0, Math.min(1, rating.average - (n - 1)))} />
        ))}
      </span>
      {showCount && <span aria-hidden="true">{rating.average.toFixed(1)} ({rating.count})</span>}
    </p>
  );
}
