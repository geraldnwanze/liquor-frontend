import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, panel } from "@/components/admin/page-header";
import { RestoreButton } from "@/components/admin/restore-button";
import { adminGet, requireStaff } from "@/lib/api/admin";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Trash" };

interface TrashRow { type: string; type_label: string; id: string; name: string; deleted_at: string; deleted_by: string | null; blocked_by: string | null }

export default async function AdminTrash({ searchParams }: PageProps<"/admin/trash">) {
  await requireStaff("/admin/trash", "catalog.manage", "content.manage", "promotions.manage", "shipping.manage", "reviews.moderate", "customers.manage");
  const raw = (await searchParams).type;
  const type = typeof raw === "string" && /^[a-z]{3,12}$/.test(raw) ? raw : "";
  const { data } = await adminGet<{ data: TrashRow[]; types: { type: string; label: string }[] }>("/trash", type ? { type } : undefined);
  if (!data) return <p role="alert">The trash could not be loaded.</p>;

  return (
    <>
      <PageHeader title="Trash" subtitle="Things that were deleted. Nothing is erased: restore a record to bring it (and what was deleted with it) back." />
      <nav aria-label="Kind of record" className="mb-5 flex flex-wrap gap-2">
        {[{ type: "", label: "Everything" }, ...data.types].map((t) => (
          <Link key={t.type} href={t.type ? `/admin/trash?type=${t.type}` : "/admin/trash"} aria-current={type === t.type ? "page" : undefined} className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-medium ${type === t.type ? "bg-burgundy text-ivory" : "border border-stone-300 bg-white hover:bg-stone-50"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      {data.data.length === 0 ? (
        <p className={`${panel} p-8 text-center text-muted`}>Nothing has been deleted.</p>
      ) : (
        <ul className="space-y-3">
          {data.data.map((r) => (
            <li key={`${r.type}-${r.id}`} className={`${panel} flex flex-wrap items-center justify-between gap-3 p-4`}>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">{r.type_label}</p>
                <p className="truncate font-medium">{r.name}</p>
                <p className="text-xs text-muted">Deleted {formatDateTime(r.deleted_at)}{r.deleted_by ? ` by ${r.deleted_by}` : ""}</p>
              </div>
              {r.blocked_by ? <p className="text-sm text-muted">Restore the {r.blocked_by} first.</p> : <RestoreButton type={r.type} id={r.id} />}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
