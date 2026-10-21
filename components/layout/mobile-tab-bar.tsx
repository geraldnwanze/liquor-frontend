"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";

const ICON = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  shop: "M3 6h18M3 12h18M3 18h12",
  saved: "M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z",
  cart: "M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2",
  account: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Thumb-reach navigation for phones. Hidden from `md` up, where the header carries everything. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { cart, openDrawer } = useCart();
  const count = cart.item_count;
  const tab = (active: boolean) => `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${active ? "text-gold" : "text-ivory/65 hover:text-ivory"}`;
  const links = [
    { href: "/", label: "Home", d: ICON.home, active: pathname === "/" },
    { href: "/search", label: "Shop", d: ICON.shop, active: pathname === "/search" },
    { href: "/account/wishlist", label: "Saved", d: ICON.saved, active: pathname.startsWith("/account/wishlist") },
  ];
  return (
    <nav aria-label="Quick navigation" className="print:hidden fixed inset-x-0 bottom-0 z-30 border-t border-gold/15 bg-[#0f0b0a]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md">
        {links.map((l) => (
          <li key={l.href} className="flex flex-1">
            <Link href={l.href} aria-current={l.active ? "page" : undefined} className={tab(l.active)}>
              <Icon d={l.d} />
              {l.label}
            </Link>
          </li>
        ))}
        <li className="flex flex-1">
          <button type="button" onClick={openDrawer} className={`${tab(false)} relative`} aria-label={count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart"}>
            <Icon d={ICON.cart} />
            Cart
            {count > 0 && <span aria-hidden="true" className="absolute right-[28%] top-1.5 flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-midnight">{count}</span>}
          </button>
        </li>
        <li className="flex flex-1">
          <Link href="/account" aria-current={pathname === "/account" || (pathname.startsWith("/account/") && !pathname.startsWith("/account/wishlist")) ? "page" : undefined} className={tab(pathname === "/account" || (pathname.startsWith("/account/") && !pathname.startsWith("/account/wishlist")))}>
            <Icon d={ICON.account} />
            Account
          </Link>
        </li>
      </ul>
    </nav>
  );
}
