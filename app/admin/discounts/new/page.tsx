import type { Metadata } from "next";
import Link from "next/link";
import { DiscountForm } from "@/components/admin/discount-form";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";

export const metadata: Metadata = { title: "New discount" };

export default async function NewDiscount() {
  await requireStaff("/admin/discounts/new", "promotions.manage");
  const { data } = await adminGet<{ data: { categories: { id: string; name: string; parent_id: string | null }[] } }>("/discounts/targets");
  return (
    <>
      <Link href="/admin/discounts" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><span aria-hidden="true">←</span> All discounts</Link>
      <PageHeader title="New discount" subtitle="Customers enter the code in their cart. It is checked again when they place the order." />
      <div className={`${panel} p-5`}><DiscountForm categories={data?.data.categories ?? []} /></div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
