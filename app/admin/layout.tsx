import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSidebar, SidebarFrame } from "@/components/admin/admin-sidebar";

// Staff area: never indexed, never cached by the service worker (see sw/policy.js).
// Every admin page is per-person data behind a sign-in, so it is a blocking route by design (no prerendered shell).
export const instant = false;

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-[#f3f0eb] text-ink lg:grid lg:grid-cols-[15rem_1fr] print:block print:bg-white">
      <Suspense fallback={<SidebarFrame name={null} signedIn={false} permissions={[]} />}>
        <AdminSidebar />
      </Suspense>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8 print:p-0">
        <div className="mx-auto w-full max-w-6xl">
          <Suspense fallback={<p role="status" className="py-16 text-center text-muted">Loading…</p>}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
