import type { Metadata } from "next";
import Link from "next/link";
import { DeletionActions } from "@/components/admin/deletion-actions";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Deletion requests" };

interface Row { id: string; status: string; requested_at: string; processed_at: string | null; reason: string | null; staff_note: string | null; customer: { id: string; name: string; email: string | null }; paid_orders: number; has_open_orders: boolean }

const TABS = [["pending", "Waiting"], ["completed", "Erased"], ["rejected", "Declined"], ["cancelled", "Withdrawn"]] as const;

export default async function AdminDeletionRequests({ searchParams }: PageProps<"/admin/deletion-requests">) {
  await requireStaff("/admin/deletion-requests", "customers.manage");
  const raw = (await searchParams).status;
  const status = TABS.some(([s]) => s === raw) ? (raw as string) : "pending";
  const { data } = await adminGet<{ data: Row[] }>("/deletion-requests", { status });
  if (!data) return <p role="alert">Deletion requests could not be loaded.</p>;

  return (
    <>
      <PageHeader title="Deletion requests" subtitle="Customers who asked for their account to be deleted. Erasing removes their personal details and keeps their orders (which the business must retain)." />
      <nav aria-label="Request status" className="mb-5 flex flex-wrap gap-2">
        {TABS.map(([value, label]) => (
          <Link key={value} href={`/admin/deletion-requests?status=${value}`} aria-current={status === value ? "page" : undefined} className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${status === value ? "bg-burgundy text-ivory" : "border border-stone-300 bg-white hover:bg-stone-50"}`}>{label}</Link>
        ))}
      </nav>
      {data.data.length === 0 ? (
        <p className={`${panel} p-8 text-center text-muted`}>Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {data.data.map((r) => (
            <li key={r.id} className={`${panel} p-5`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {r.status === "completed" ? r.customer.name : <Link href={`/admin/customers/${r.customer.id}`} className="text-burgundy hover:underline">{r.customer.name}</Link>}
                  {r.customer.email && <span className="ml-2 text-sm font-normal text-muted">{r.customer.email}</span>}
                </p>
                <p className="text-xs text-muted">Asked {formatDateTime(r.requested_at)} · {r.paid_orders} paid {r.paid_orders === 1 ? "order" : "orders"}</p>
              </div>
              {r.reason && <p className="mt-2 text-sm">Reason given: {r.reason}</p>}
              {r.staff_note && <p className="mt-2 text-sm text-muted">Our reply: {r.staff_note}</p>}
              {r.status === "pending" && <div className="mt-4 border-t border-stone-100 pt-4"><DeletionActions id={r.id} hasOpenOrders={r.has_open_orders} /></div>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
