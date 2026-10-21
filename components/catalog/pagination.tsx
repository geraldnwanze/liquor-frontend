import Link from "next/link";

function pageHref(basePath: string, params: Record<string, string>, page: number): string {
  const query = new URLSearchParams(params);
  if (page > 1) query.set("page", String(page));
  else query.delete("page");
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({ basePath, params, current, last }: { basePath: string; params: Record<string, string>; current: number; last: number }) {
  if (last <= 1) return null;
  const pages = Array.from({ length: last }, (_, i) => i + 1).filter((p) => p === 1 || p === last || Math.abs(p - current) <= 1);
  const link = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-ink/40 px-3 text-sm";

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {current > 1 && (
        <Link href={pageHref(basePath, params, current - 1)} rel="prev" className={link}>
          Previous
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 && <span aria-hidden="true">…</span>}
          <Link
            href={pageHref(basePath, params, p)}
            aria-current={p === current ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={`${link} ${p === current ? "bg-gold text-midnight" : "hover:bg-gold/10"}`}
          >
            {p}
          </Link>
        </span>
      ))}
      {current < last && (
        <Link href={pageHref(basePath, params, current + 1)} rel="next" className={link}>
          Next
        </Link>
      )}
    </nav>
  );
}
