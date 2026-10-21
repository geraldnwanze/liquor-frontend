"use client";

import { useWishlist } from "./wishlist-provider";

/** Save for later. `name` is announced so each heart on a page is distinguishable. */
export function HeartButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(slug);
  return (
    <button
      type="button"
      onClick={() => void toggle(slug)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from your wishlist` : `Save ${name} to your wishlist`}
      className={`relative z-10 inline-flex size-10 items-center justify-center rounded-full bg-[#0f0b0a]/70 text-ivory backdrop-blur transition hover:bg-[#0f0b0a] ${className}`}
    >
      <svg viewBox="0 0 24 24" className={`size-5 transition ${saved ? "fill-gold text-gold" : "fill-none"}`} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" />
      </svg>
    </button>
  );
}
