import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountNav } from "@/components/account/account-nav";

// Personal pages: never indexed, and the service worker never saves them (see sw/policy.js).
export const metadata: Metadata = { title: { default: "My account", template: "%s | My account" }, robots: { index: false, follow: false } };

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="sr-only">My account</h1>
      {/* usePathname() is resolved at request time, so the nav streams in; the placeholder holds its height. */}
      <Suspense fallback={<div className="h-14 border-b border-burgundy/15" aria-hidden="true" />}>
        <AccountNav />
      </Suspense>
      <div className="mt-6">
        <Suspense fallback={<p role="status" className="py-16 text-center text-muted">Loading…</p>}>{children}</Suspense>
      </div>
    </div>
  );
}
