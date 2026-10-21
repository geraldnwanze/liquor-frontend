"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  dashboard: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10",
  products: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  discounts: "M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8zM7.5 7.5h.01",
  customers: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  staff: "M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5zM9 12l2 2 4-4",
  reports: "M3 3v18h18M7 15l4-4 3 3 5-6",
  reviews: "M12 2l3 6.3 6.9.9-5 4.8 1.2 6.9L12 17.6 5.9 20.9 7.1 14 2.1 9.2 9 8.3z",
  newsletter: "M4 4h16v16H4zM4 7l8 6 8-6",
  categories: "M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z",
  brands: "M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8zM7.5 7.5h.01M12 12h4",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6",
  home: "M3 11l9-8 9 8M5 10v10h14V10M9 20v-6h6v6",
  deletions: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM17 8l5 5M22 8l-5 5",
  pages: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h8",
  orders: "M6 2l-3 4v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
} as const;

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: ICONS.dashboard, any: [] as string[] },
  { href: "/admin/orders", label: "Orders", icon: ICONS.orders, any: ["orders.view", "orders.manage"] },
  { href: "/admin/customers", label: "Customers", icon: ICONS.customers, any: ["customers.manage"] },
  { href: "/admin/deletion-requests", label: "Deletion requests", icon: ICONS.deletions, any: ["customers.manage"] },
  { href: "/admin/products", label: "Products", icon: ICONS.products, any: ["catalog.manage"] },
  { href: "/admin/categories", label: "Categories", icon: ICONS.categories, any: ["catalog.manage"] },
  { href: "/admin/brands", label: "Brands", icon: ICONS.brands, any: ["catalog.manage"] },
  { href: "/admin/reviews", label: "Reviews", icon: ICONS.reviews, any: ["reviews.moderate"] },
  { href: "/admin/reports", label: "Reports", icon: ICONS.reports, any: ["reports.view"] },
  { href: "/admin/discounts", label: "Discounts", icon: ICONS.discounts, any: ["promotions.manage"] },
  { href: "/admin/home", label: "Home page", icon: ICONS.home, any: ["content.manage"] },
  { href: "/admin/pages", label: "Pages", icon: ICONS.pages, any: ["content.manage"] },
  { href: "/admin/newsletter", label: "Newsletter", icon: ICONS.newsletter, any: ["promotions.manage"] },
  { href: "/admin/trash", label: "Trash", icon: ICONS.trash, any: ["catalog.manage", "content.manage", "promotions.manage", "shipping.manage", "reviews.moderate", "customers.manage"] },
  { href: "/admin/settings", label: "Settings", icon: ICONS.settings, any: ["settings.manage", "shipping.manage"] },
  { href: "/admin/staff", label: "Staff", icon: ICONS.staff, any: ["staff.manage"] },
];

/** `permissions` only decides which links to show; the API and each page still enforce access. */
export function AdminNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const shown = LINKS.filter((l) => l.any.length === 0 || permissions.includes("*") || l.any.some((p) => permissions.includes(p)));
  return (
    <nav aria-label="Admin" className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:mx-0 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain lg:px-0">
      {shown.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 lg:min-h-10 text-sm font-medium transition-colors ${active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/8 hover:text-white"}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={link.icon} />
            </svg>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
