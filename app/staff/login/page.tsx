import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { StaffLoginForm } from "@/components/staff/staff-login-form";
import { getStaffUser } from "@/lib/api/admin";
import { getBranding } from "@/lib/api/catalog";
import { safeNext } from "@/lib/auth/safe-next";
import Image from "next/image";

function Card({ children, branding }: { children: React.ReactNode; branding?: { name: string; logoUrl: string | null } }) {
  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-3">
        {branding?.logoUrl ? (
          <Image src={branding.logoUrl} alt="" width={120} height={48} className="h-10 w-auto max-w-[7rem] rounded-md bg-white/90 object-contain p-1" />
        ) : (
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-gold/20 text-sm font-semibold text-gold">{(branding?.name ?? "Premium Liquor").charAt(0)}</span>
        )}
        <div className="leading-tight">
          <h1 className="text-xl font-semibold">Staff sign in</h1>
          <p className="text-sm text-white/60">{branding?.name ?? "Premium Liquor"} admin</p>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">{children}</div>
      <p className="mt-4 text-center text-xs text-white/50">Shopping instead? <Link href="/login" className="underline underline-offset-4 hover:text-white">Customer sign in</Link></p>
    </div>
  );
}

export default function StaffLoginPage({ searchParams }: PageProps<"/staff/login">) {
  return (
    <Suspense fallback={<Card>{null}</Card>}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/staff/login">, "searchParams">) {
  const next = safeNext((await searchParams).next);
  const target = next.startsWith("/admin") ? next : "/admin";
  // Already signed in as staff (verified with the API, so an expired cookie can't cause a redirect loop).
  const [staff, branding] = await Promise.all([getStaffUser(), getBranding()]);
  if (staff) redirect(target);
  return (
    <Card branding={branding}>
      <StaffLoginForm next={target} />
    </Card>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
