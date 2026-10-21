"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

const LINKS = [
  { href: "/account", label: "Details" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="flex flex-wrap items-center justify-between gap-3 border-b border-burgundy/15 pb-3">
      <ul className="flex flex-wrap gap-1">
        {LINKS.map((link) => {
          const active = link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${active ? "bg-gold text-midnight" : "text-accent hover:bg-gold/10"}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <LogoutButton />
    </nav>
  );
}
