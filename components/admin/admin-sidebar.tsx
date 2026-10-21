import Link from "next/link";
import { Suspense } from "react";
import { StaffLogoutButton } from "@/components/staff/staff-logout-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { getStaffUser } from "@/lib/api/admin";
import { getBranding } from "@/lib/api/catalog";
import Image from "next/image";

/** The staff app's own chrome: nothing from the customer shop (no cart, categories or install prompt). */
export async function AdminSidebar() {
  const [user, branding] = await Promise.all([getStaffUser(), getBranding()]);
  return <SidebarFrame name={user?.name ?? null} signedIn={Boolean(user)} permissions={user?.permissions ?? []} business={branding} />;
}

export function SidebarFrame({ name, signedIn, permissions, business }: { name: string | null; signedIn: boolean; permissions: string[]; business?: { name: string; logoUrl: string | null } }) {
  return (
    <aside className="print:hidden flex flex-col gap-4 bg-midnight px-4 py-4 text-white lg:sticky lg:top-0 lg:h-dvh lg:gap-6 lg:px-4 lg:py-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/admin" className="flex items-center gap-3">
          {business?.logoUrl ? (
            <Image src={business.logoUrl} alt="" width={120} height={48} className="h-9 w-auto max-w-[7rem] rounded-md bg-white/90 object-contain p-1" />
          ) : (
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-gold/20 text-sm font-semibold text-gold">{(business?.name ?? "Premium Liquor").charAt(0)}</span>
          )}
          <span className="leading-tight">
            <span className="block text-sm font-semibold">{business?.name ?? "Premium Liquor"}</span>
            <span className="block text-xs text-white/55">Admin</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/" target="_blank" rel="noopener" className="rounded-lg px-3 py-2 text-xs text-white/70 hover:text-white">View store<span className="sr-only"> (opens in a new tab)</span></Link>
        </div>
      </div>
      <Suspense fallback={<div className="h-24" aria-hidden="true" />}>
        <AdminNav permissions={permissions} />
      </Suspense>
      <div className="hidden shrink-0 flex-col gap-3 border-t border-white/10 pt-4 lg:flex">
        {signedIn && name && <p className="truncate text-sm text-white/80">{name}</p>}
        <Link href="/" target="_blank" rel="noopener" className="text-sm text-white/65 hover:text-white">View store<span className="sr-only"> (opens in a new tab)</span></Link>
        {signedIn && <StaffLogoutButton className="min-h-10 rounded-lg border border-white/20 px-3 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-60" />}
      </div>
    </aside>
  );
}
