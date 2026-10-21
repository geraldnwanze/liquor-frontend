import type { Money } from "@/lib/api/types";

/** Current price, with the regular price struck through (and announced to screen readers) when discounted. */
export function Price({ current, regular, prefix, className = "" }: { current: Money; regular?: Money | null; prefix?: string; className?: string }) {
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
      {prefix && <span className="text-sm text-muted">{prefix}</span>}
      <span className="font-semibold text-accent">{current.formatted}</span>
      {regular && regular.kobo > current.kobo && (
        <>
          <span className="sr-only">Regular price</span>
          <s className="text-sm text-muted">{regular.formatted}</s>
        </>
      )}
    </p>
  );
}
