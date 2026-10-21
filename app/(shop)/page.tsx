import Image from "next/image";
import Link from "next/link";
import { BottleArt } from "@/components/catalog/bottle-art";
import { ProductCard } from "@/components/catalog/product-card";
import { getBestSellers, getCategories, getHomepage, getProducts } from "@/lib/api/catalog";
import { brand } from "@/lib/brand";

const PROMISES = [
  { title: "Pay securely online", text: "You pay on your card provider's own page. We never see your card details.", icon: "M3 7h18v10H3zM3 11h18M7 15h3" },
  { title: "Follow your order", text: "A clear timeline from confirmation to delivery, and a receipt when you've paid.", icon: "M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z" },
  { title: "Adults only", text: "Everything here is for customers of legal drinking age. Our driver may ask for ID.", icon: "M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6z" },
];

const STEPS = [
  { n: "01", title: "Choose", text: "Browse the collection or search for a bottle." },
  { n: "02", title: "Pay", text: "Check out as a guest or with an account." },
  { n: "03", title: "Track", text: "Watch your order move from packed to delivered." },
];

/** A button link: site paths use client navigation; https addresses open as ordinary links. */
function CtaLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return href.startsWith("/") ? (
    <Link href={href} className={className}>{children}</Link>
  ) : (
    <a href={href} rel="noopener noreferrer" className={className}>{children}</a>
  );
}

function SectionHeading({ id, eyebrow, title, href, cta }: { id: string; eyebrow: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-3xl text-accent sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-gold transition hover:gap-2 hover:text-ivory">
          {cta ?? "View all"} <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const [categories, newest, bestSellers, hp] = await Promise.all([getCategories(), getProducts({ sort: "newest", per_page: 24 }), getBestSellers(4), getHomepage()]);
  const featured = categories.filter((c) => c.is_featured);
  const tiles = featured.length > 0 ? featured : categories.slice(0, 6);
  const arrivals = newest.data.slice(0, 8);
  const primary = hp.hero_primary_label && hp.hero_primary_href ? { label: hp.hero_primary_label, href: hp.hero_primary_href } : { label: "Shop the collection", href: "/search" };
  const secondary = hp.hero_secondary_label && hp.hero_secondary_href ? { label: hp.hero_secondary_label, href: hp.hero_secondary_href } : tiles[0] ? { label: `Browse ${tiles[0].name}`, href: `/${tiles[0].slug}` } : null;
  const onSale = newest.data.filter((p) => p.compare_at_price !== null && p.in_stock).slice(0, 4);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        {hp.hero_image_url && (
          <>
            <Image src={hp.hero_image_url} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-40" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0f0b0a] via-[#0f0b0a]/70 to-[#0f0b0a]/30" />
          </>
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_80%_30%,rgba(142,42,64,0.6),transparent_70%),radial-gradient(45%_55%_at_8%_100%,rgba(201,163,90,0.16),transparent_70%),radial-gradient(30%_40%_at_50%_0%,rgba(201,163,90,0.08),transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-gold">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" /> {hp.hero_eyebrow ?? "Wine · Whiskey · Rum · Gin"}
            </p>
            <h1 className="mt-6 text-balance text-5xl leading-[1.04] sm:text-7xl">
              {hp.hero_title ?? "Pour something"}{" "}
              {(hp.hero_title ? hp.hero_title_emphasis : (hp.hero_title_emphasis ?? "worth remembering.")) && <span className="text-shine italic">{hp.hero_title ? hp.hero_title_emphasis : (hp.hero_title_emphasis ?? "worth remembering.")}</span>}
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ivory/75">{hp.hero_text ?? brand.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <CtaLink href={primary.href} className="inline-flex min-h-13 items-center rounded-full bg-gold px-8 text-base font-semibold text-midnight shadow-[0_10px_30px_-10px_rgba(201,163,90,0.7)] transition hover:bg-[#dcb86e]">
                {primary.label}
              </CtaLink>
              {secondary && (
                <CtaLink href={secondary.href} className="inline-flex min-h-13 items-center rounded-full border border-gold/60 px-8 text-base font-semibold text-accent transition hover:bg-gold/10">
                  {secondary.label}
                </CtaLink>
              )}
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ivory/70">
              {["Secure online payment", "Live order tracking", "Adults only"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="size-4 text-gold" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 4 4 10-10" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div aria-hidden="true" className="relative mx-auto hidden h-96 w-full max-w-sm lg:block">
            <span className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/15" />
            <span className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/25" />
            <BottleArt className="float-slow absolute left-0 top-14 h-64 -rotate-6 opacity-70 [animation-delay:-2s]" glow={false} />
            <BottleArt className="float-slow absolute left-20 top-0 h-80" />
            <BottleArt className="float-slow absolute right-0 top-16 h-60 rotate-6 opacity-70 [animation-delay:-4s]" glow={false} />
          </div>
        </div>
        <div className="luxe-rule" aria-hidden="true" />
      </section>

      {tiles.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pt-16" aria-labelledby="shop-by-category">
          <SectionHeading id="shop-by-category" eyebrow="Explore" title="Shop by category" href="/search" cta="All products" />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((c, i) => (
              <li key={c.slug}>
                <Link
                  href={`/${c.slug}`}
                  className="group relative flex min-h-52 flex-col justify-between overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-br from-[#2a1b17] via-[#1a1210] to-[#120c0a] p-6 transition duration-300 hover:-translate-y-0.5 hover:border-gold/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {c.image_url && (
                    <>
                      <Image src={c.image_url} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover opacity-50 transition duration-700 group-hover:scale-105 group-hover:opacity-65 motion-reduce:transition-none" />
                      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0f0b0a] via-[#0f0b0a]/40 to-transparent" />
                    </>
                  )}
                  <span aria-hidden="true" className="absolute -right-6 -top-10 size-40 rounded-full bg-burgundy/30 blur-2xl transition group-hover:bg-burgundy/50" />
                  <span aria-hidden="true" className="relative font-display text-sm text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span className="relative">
                    <span className="flex items-end justify-between gap-3">
                      <span className="font-display text-3xl font-semibold">{c.name}</span>
                      <span aria-hidden="true" className="mb-1 text-xl text-gold transition group-hover:translate-x-1 motion-reduce:transition-none">→</span>
                    </span>
                    {c.description && <span className="mt-2 line-clamp-2 block text-sm text-ivory/65">{c.description}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hp.show_best_sellers && bestSellers.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pt-20" aria-labelledby="best-sellers-h">
          <SectionHeading id="best-sellers-h" eyebrow="Most loved" title="Best sellers" href="/search" />
          <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {bestSellers.map((product, i) => (
              <li key={product.slug}>
                <ProductCard product={product} priority={i < 2} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hp.show_new_arrivals && arrivals.length > 0 && (
        <section id="new-arrivals" className="mx-auto w-full max-w-6xl scroll-mt-28 px-4 pt-20" aria-labelledby="new-arrivals-h">
          <SectionHeading id="new-arrivals-h" eyebrow="Just in" title="New arrivals" href="/search" />
          <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {arrivals.map((product, i) => (
              <li key={product.slug}>
                <ProductCard product={product} priority={i < 4} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hp.show_on_sale && onSale.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pt-20" aria-labelledby="on-sale-h">
          <SectionHeading id="on-sale-h" eyebrow="Offers" title="Reduced right now" />
          <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {onSale.map((product) => (
              <li key={product.slug}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hp.show_how_it_works && (
      <section className="mx-auto w-full max-w-6xl px-4 pt-20" aria-labelledby="how-it-works">
        <SectionHeading id="how-it-works" eyebrow="Simple" title="From shelf to door" />
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="relative overflow-hidden rounded-2xl border border-gold/10 bg-white p-6">
              <span aria-hidden="true" className="font-display text-5xl text-gold/30">{s.n}</span>
              <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      )}

      {hp.show_promises && (
      <section aria-label="Why shop with us" className="mx-auto w-full max-w-6xl px-4 pt-12">
        <ul className="grid gap-4 sm:grid-cols-3">
          {PROMISES.map((p) => (
            <li key={p.title} className="flex gap-4 rounded-2xl border border-gold/10 bg-white p-5">
              <svg viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={p.icon} />
              </svg>
              <div>
                <h2 className="!font-sans text-sm font-semibold tracking-wide">{p.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      )}
    </>
  );
}
