import type { Metadata } from "next";
import Link from "next/link";
import { DownloadCsv } from "@/components/admin/download-csv";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";
import { formatDate } from "@/lib/format";
import { LiveFilter } from "@/components/admin/live-filter";

export const metadata: Metadata = { title: "Newsletter" };

interface Subscriber { email: string; confirmed_at: string; consented_at: string; consent_text: string }

export default async function AdminNewsletter() {
  await requireStaff("/admin/newsletter", "promotions.manage");
  const { data } = await adminGet<{ data: Subscriber[]; summary: { active: number; awaiting_confirmation: number; unsubscribed: number } }>("/newsletter");
  if (!data) return <p role="alert">The newsletter list could not be loaded.</p>;
  const { summary } = data;

  return (
    <>
      <PageHeader title="Newsletter" subtitle="People who confirmed by email. Write and send campaigns from the Campaigns page, or export the list.">
        <Link href="/admin/newsletter/campaigns" className="inline-flex h-9 items-center rounded-lg bg-burgundy px-3 text-sm font-semibold text-ivory hover:bg-burgundy-deep">Campaigns</Link>
        <DownloadCsv filename="newsletter-subscribers.csv" rows={[["Email", "Confirmed", "Consent given", "Consent wording"], ...data.data.map((s) => [s.email, s.confirmed_at, s.consented_at, s.consent_text])]} />
      </PageHeader>
      <dl className="mb-5 grid gap-3 sm:grid-cols-3">
        {[["Subscribed", summary.active], ["Awaiting confirmation", summary.awaiting_confirmation], ["Unsubscribed", summary.unsubscribed]].map(([label, n]) => (
          <div key={label} className={`${panel} p-4`}>
            <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{n}</dd>
          </div>
        ))}
      </dl>
      <LiveFilter targetId="subscribers" label="Filter subscribers" placeholder="Filter by email" />
      <div id="subscribers" className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[28rem] text-left text-sm">
          <caption className="sr-only">Confirmed subscribers, newest first</caption>
          <thead>
            <tr className="border-b border-stone-200 text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="px-3 py-3 font-medium">Email</th>
              <th scope="col" className="px-3 py-3 font-medium">Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((s) => (
              <tr key={s.email} data-filter-item className="border-b border-stone-100">
                <td className="px-3 py-2.5">{s.email}</td>
                <td className="px-3 py-2.5 text-muted">{formatDate(s.confirmed_at)}</td>
              </tr>
            ))}
            {data.data.length === 0 && <tr><td colSpan={2} className="px-3 py-8 text-center text-muted">No confirmed subscribers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
