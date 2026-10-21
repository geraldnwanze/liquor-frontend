import type { Metadata } from "next";
import Link from "next/link";
import { DeletePageButton } from "@/components/admin/delete-page-button";
import { PageForm } from "@/components/admin/page-form";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { CmsPage } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { LiveFilter } from "@/components/admin/live-filter";

export const metadata: Metadata = { title: "Pages" };

export default async function AdminPages() {
  await requireStaff("/admin/pages", "content.manage");
  const { data } = await adminGet<{ data: CmsPage[] }>("/pages");
  if (!data) return <p role="alert">Pages could not be loaded.</p>;

  return (
    <>
      <PageHeader title="Pages" subtitle="Information pages such as delivery, returns and FAQs. Published pages are linked from the shop footer." />

      <section className={`${panel} mb-6 p-5`} aria-labelledby="new-page">
        <h2 id="new-page" className="mb-3 text-lg font-semibold">New page</h2>
        <PageForm />
      </section>

      <LiveFilter targetId="pages-list" label="Filter pages" placeholder="Filter by title or address" />
      <ul id="pages-list" className="space-y-3">
        {data.data.map((p) => (
          <li key={p.id} data-filter-item data-filter-text={`${p.title} ${p.slug} ${p.status}`} className={`${panel} p-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{p.title}</h2>
              <p className="text-xs text-muted">
                <span className={`mr-2 rounded-full px-2 py-0.5 ${p.status === "published" ? "bg-emerald-100 text-emerald-900" : "bg-stone-200 text-stone-700"}`}>{p.status === "published" ? "Published" : "Draft"}</span>
                Updated {formatDateTime(p.updated_at)}
              </p>
            </div>
            <p className="mt-1 text-sm text-muted">
              /info/{p.slug}
              {p.status === "published" && <> · <Link href={`/info/${p.slug}`} className="underline underline-offset-4">View on the shop</Link></>}
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-burgundy">Edit</summary>
              <div className="mt-3"><PageForm page={p} /></div>
            </details>
            <div className="mt-4 border-t border-stone-100 pt-4"><DeletePageButton id={p.id} slug={p.slug} /></div>
          </li>
        ))}
        {data.data.length === 0 && <li className={`${panel} p-8 text-center text-muted`}>No pages yet.</li>}
      </ul>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
