import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { getBranding, getCategories, getFooterPages } from "@/lib/api/catalog";
import { brand } from "@/lib/brand";
import { BrandMark } from "@/components/layout/brand-mark";

export async function SiteFooter() {
  const [categories, pages, branding] = await Promise.all([getCategories(), getFooterPages(), getBranding()]);
  return (
    <footer className="print:hidden mt-20 bg-midnight text-ivory/75">
      <div className="luxe-rule" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-4 pt-12">
        <div className="grid gap-6 rounded-2xl border border-gold/20 bg-white/[0.03] p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl text-accent sm:text-3xl">Join the list</h2>
            <p className="mt-2 text-sm leading-relaxed text-ivory/70">News and offers by email. We&apos;ll ask you to confirm first, and every email can be opted out of.</p>
          </div>
          <NewsletterForm id="footer-newsletter" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          {branding.logoUrl ? <BrandMark name={branding.name} logoUrl={branding.logoUrl} className="h-12" /> : null}
          <p className={`font-display text-xl font-semibold text-ivory ${branding.logoUrl ? "sr-only" : ""}`}>{branding.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">{brand.description}</p>
        </div>
        {categories.length > 0 && (
          <nav aria-label="Shop">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Shop</p>
            <ul className="mt-3 space-y-1 text-sm">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/${c.slug}`} className="inline-flex min-h-9 items-center hover:text-gold">{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {pages.length > 0 && (
          <nav aria-label="Information">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Information</p>
            <ul className="mt-3 space-y-1 text-sm">
              {pages.map((p) => (
                <li key={p.slug}><Link href={`/info/${p.slug}`} className="inline-flex min-h-9 items-center hover:text-gold">{p.title}</Link></li>
              ))}
            </ul>
          </nav>
        )}
        <nav aria-label="Your account">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Your account</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li><Link href="/account/wishlist" className="inline-flex min-h-9 items-center hover:text-gold">Wishlist</Link></li>
            <li><Link href="/account/orders" className="inline-flex min-h-9 items-center hover:text-gold">Your orders</Link></li>
            <li><Link href="/account" className="inline-flex min-h-9 items-center hover:text-gold">Your details</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-ivory/60">
          Please drink responsibly. Alcohol is sold only to adults of legal drinking age, and our driver may ask for ID on delivery.
        </p>
      </div>
    </footer>
  );
}
