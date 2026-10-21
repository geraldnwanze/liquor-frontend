import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, panel } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { adminGet, requireStaff } from "@/lib/api/admin";

export const metadata: Metadata = { title: "New product" };

export default async function NewProduct() {
  await requireStaff("/admin/products/new", "catalog.manage");
  const [brands, cats] = await Promise.all([
    adminGet<{ data: { id: string; name: string }[] }>("/brands"),
    adminGet<{ data: { id: string; name: string; parent_id: string | null }[] }>("/categories"),
  ]);
  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><span aria-hidden="true">←</span> All products</Link>
      <PageHeader title="New product" subtitle="Saved as a draft. Add a variant and images, then publish." />
      <div className={`${panel} p-5`}><ProductForm brands={brands.data?.data ?? []} categories={cats.data?.data ?? []} /></div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
