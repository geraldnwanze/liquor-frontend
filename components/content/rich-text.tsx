import Link from "next/link";
import { parseMarkdown, type Block, type Inline } from "@/lib/markdown";

function inline(nodes: Inline[]): React.ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.v;
      case "br":
        return <br key={i} />;
      case "b":
        return <strong key={i}>{inline(n.c)}</strong>;
      case "i":
        return <em key={i}>{inline(n.c)}</em>;
      case "code":
        return <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.9em]">{n.v}</code>;
      case "a":
        return n.href.startsWith("/") ? (
          <Link key={i} href={n.href} className="text-accent underline underline-offset-4">{inline(n.c)}</Link>
        ) : (
          <a key={i} href={n.href} rel="noopener noreferrer" target={n.href.startsWith("http") ? "_blank" : undefined} className="text-accent underline underline-offset-4">{inline(n.c)}</a>
        );
    }
  });
}

function block(b: Block, i: number) {
  switch (b.t) {
    case "h":
      return b.level === 1 ? <h2 key={i} className="pt-4 text-3xl text-accent">{inline(b.c)}</h2> : b.level === 2 ? <h2 key={i} className="pt-4 text-2xl text-accent">{inline(b.c)}</h2> : <h3 key={i} className="pt-2 font-display text-xl font-semibold text-ivory">{inline(b.c)}</h3>;
    case "p":
      return <p key={i}>{inline(b.c)}</p>;
    case "ul":
      return <ul key={i} className="list-disc space-y-1 pl-6">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>;
    case "ol":
      return <ol key={i} className="list-decimal space-y-1 pl-6">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>;
    case "quote":
      return <blockquote key={i} className="border-l-4 border-gold/60 pl-4 italic text-ivory/70">{inline(b.c)}</blockquote>;
    case "hr":
      return <hr key={i} className="border-gold/20" />;
    case "img":
      return (
        <figure key={i}>
          {/* eslint-disable-next-line @next/next/no-img-element -- staff-chosen https picture inside page text */}
          <img src={b.src} alt={b.alt} loading="lazy" className="max-h-[32rem] w-full rounded-xl border border-gold/15 object-cover" />
          {b.alt && <figcaption className="mt-2 text-sm text-muted">{b.alt}</figcaption>}
        </figure>
      );
  }
}

/** Renders staff-written page text (a safe Markdown subset) as elements. Nothing in it can add HTML or script. */
export function RichText({ source, className = "" }: { source: string; className?: string }) {
  return <div className={`space-y-5 leading-relaxed text-ivory/80 ${className}`}>{parseMarkdown(source).map(block)}</div>;
}
