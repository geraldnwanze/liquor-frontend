import Link from "next/link";
import { Suspense } from "react";
import { AccountLink } from "@/components/account/account-link";
import { CartButton } from "@/components/cart/cart-button";
import { SearchBox } from "@/components/layout/search-box";
import { InstallButton } from "@/components/pwa/install-button";
import { getBranding, getCategories, getHomepage } from "@/lib/api/catalog";
import { brand } from "@/lib/brand";
import { BrandMark } from "@/components/layout/brand-mark";

export async function SiteHeader() {
  const [categories, branding, hp] = await Promise.all([getCategories(), getBranding(), getHomepage()]);
  const announcement = hp.announcement_text ?? "Adults only · Secure online payment · Track every order from checkout to your door";
  return (
    <header className="print:hidden sticky top-0 z-30 border-b border-gold/15 bg-[#0f0b0a]/90 pt-[env(safe-area-inset-top)] text-ivory backdrop-blur supports-[backdrop-filter]:bg-[#0f0b0a]/80">
      <p className={`bg-gold/10 px-4 py-1.5 text-center text-xs tracking-wide text-gold ${hp.announcement_text ? "" : "hidden sm:block"}`}>
        {hp.announcement_link ? (
          hp.announcement_link.startsWith("/") ? <Link href={hp.announcement_link} className="underline-offset-4 hover:underline">{announcement}</Link> : <a href={hp.announcement_link} rel="noopener noreferrer" className="underline-offset-4 hover:underline">{announcement}</a>
        ) : (
          announcement
        )}
      </p>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <BrandMark name={branding.name} logoUrl={branding.logoUrl} />
          {/* With a logo the name is only for screen readers (logos usually carry the name already). */}
          <span className={`truncate font-display text-lg font-semibold tracking-wide ${branding.logoUrl ? "sr-only" : ""}`}>
            <span className="sm:hidden">{brand.shortName}</span>
            <span className="hidden sm:inline">{branding.name}</span>
          </span>
        </Link>
        <SearchBox id="header-search" className="mx-4 hidden max-w-md flex-1 md:block" />
        <div className="flex items-center gap-1 sm:gap-2">
          <InstallButton />
          {/* usePathname() resolves at request time; until then show the signed-out link (identical for everyone). */}
          <Suspense
            fallback={
              <Link href="/login" className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium">
                Sign in
              </Link>
            }
          >
            <AccountLink />
          </Suspense>
          <CartButton />
        </div>
      </div>
      <div className="mx-auto px-4 pb-3 md:hidden">
        <SearchBox id="header-search-mobile" />
      </div>
      {categories.length > 0 && (
        <nav aria-label="Categories" className="border-t border-gold/10">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/${c.slug}`} className="inline-flex min-h-11 items-center whitespace-nowrap px-3 tracking-wide text-ivory/80 transition hover:text-gold">
                  {c.name}
                </Link>
              </li>
            ))}
            <li className="ml-auto">
              <Link href="/search" className="inline-flex min-h-11 items-center whitespace-nowrap px-3 font-medium tracking-wide text-gold transition hover:text-ivory">
                All products
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
