import type { Metadata } from "next";
import Link from "next/link";
import { CampaignActions } from "@/components/admin/campaign-actions";
import { CampaignRetry } from "@/components/admin/campaign-retry";
import { CampaignForm } from "@/components/admin/campaign-form";
import { PageHeader, panel } from "@/components/admin/page-header";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { NewsletterCampaign } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Newsletter campaigns" };

export default async function AdminCampaigns() {
  await requireStaff("/admin/newsletter/campaigns", "promotions.manage");
  const { data } = await adminGet<{ data: NewsletterCampaign[]; active_subscribers: number }>("/newsletter/campaigns");
  if (!data) return <p role="alert">Campaigns could not be loaded.</p>;
  // Who each failed email was for, and why (only fetched for campaigns that have failures).
  const failures = new Map<string, { email: string; error: string | null }[]>();
  await Promise.all(
    data.data.filter((c) => (c.delivery?.failed ?? 0) > 0).map(async (c) => {
      const res = await adminGet<{ data: { email: string; error: string | null }[] }>(`/newsletter/campaigns/${c.id}/deliveries`, { status: "failed" });
      failures.set(c.id, res.data?.data ?? []);
    }),
  );

  return (
    <>
      <PageHeader title="Campaigns" subtitle={`Write a draft, send yourself a test, then send it to the ${data.active_subscribers} confirmed ${data.active_subscribers === 1 ? "subscriber" : "subscribers"}. A sent campaign can't be changed or sent again.`}>
        <Link href="/admin/newsletter" className="inline-flex h-9 items-center rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium hover:bg-stone-50">Subscribers</Link>
      </PageHeader>

      <section className={`${panel} mb-6 p-5`} aria-labelledby="new-campaign">
        <h2 id="new-campaign" className="mb-3 text-lg font-semibold">New campaign</h2>
        <CampaignForm />
      </section>

      <ul className="space-y-3">
        {data.data.map((c) => (
          <li key={c.id} className={`${panel} p-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{c.subject}</h2>
              <p className="text-xs text-muted">
                {c.status === "sent" ? `Sent ${c.sent_at ? formatDateTime(c.sent_at) : ""} to ${c.recipient_count} ${c.recipient_count === 1 ? "person" : "people"}` : "Draft"}
              </p>
            </div>
            {c.status === "sent" ? (
              <>
                <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted">{c.body}</p>
                {c.delivery && (
                  <div className="mt-3 border-t border-stone-100 pt-3 text-sm">
                    <p className="flex flex-wrap gap-x-5 gap-y-1">
                      <span><strong className="tabular-nums">{c.delivery.sent}</strong> delivered</span>
                      {c.delivery.queued > 0 && <span><strong className="tabular-nums">{c.delivery.queued}</strong> waiting to send</span>}
                      <span className={c.delivery.failed > 0 ? "font-medium text-red-800" : "text-muted"}><strong className="tabular-nums">{c.delivery.failed}</strong> failed</span>
                    </p>
                    {c.delivery.failed > 0 && (
                      <div className="mt-3 space-y-3">
                        <ul className="space-y-1 text-xs text-muted" aria-label="Failed emails">
                          {(failures.get(c.id) ?? []).slice(0, 20).map((f) => (
                            <li key={f.email}><span className="text-ink">{f.email}</span>{f.error ? `: ${f.error}` : ""}</li>
                          ))}
                        </ul>
                        <CampaignRetry id={c.id} failed={c.delivery.failed} />
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-burgundy">Edit draft</summary>
                <div className="mt-3">
                  <CampaignForm id={c.id} subject={c.subject} body={c.body} />
                </div>
              </details>
            )}
            {c.status === "draft" && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <CampaignActions id={c.id} subscribers={data.active_subscribers} />
              </div>
            )}
          </li>
        ))}
        {data.data.length === 0 && <li className={`${panel} p-8 text-center text-muted`}>No campaigns yet.</li>}
      </ul>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
