import type { Metadata } from "next";
import { PageHeader, panel } from "@/components/admin/page-header";
import { SettingsTabs } from "@/components/admin/settings-tabs";
import { StatusBadge } from "@/components/admin/status-badge";
import { AddZone, EditZone } from "@/components/admin/zone-forms";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminDeliveryZone } from "@/lib/api/types";
import { can } from "@/lib/auth/permissions";
import { formatNaira } from "@/lib/money";

export const metadata: Metadata = { title: "Delivery zones" };

export default async function AdminDeliveryZones() {
  const user = await requireStaff("/admin/settings/delivery", "shipping.manage");
  const { data } = await adminGet<{ data: AdminDeliveryZone[] }>("/delivery-zones");
  if (!data) return <p role="alert">Delivery zones could not be loaded.</p>;
  const zones = data.data;

  return (
    <>
      <PageHeader title="Delivery zones" subtitle="Where you deliver, what it costs and how long it takes. Checkout only offers active zones." />
      <SettingsTabs current="delivery" canSettings={can(user, "settings.manage")} canZones />
      <div className={`${panel} p-5`}>
        <ul className="divide-y divide-stone-100">
          {zones.map((z) => (
            <li key={z.id} className="py-3">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm">
                  <span><span className="font-medium">{z.name}</span> <span className="text-muted">{z.city ? `${z.city}, ${z.state}` : `All of ${z.state}`}</span></span>
                  <span className="flex items-center gap-3 tabular-nums">
                    <span>{z.fee_kobo === 0 ? "Free" : formatNaira(z.fee_kobo)}{z.free_threshold_kobo ? <span className="text-xs text-muted"> · free over {formatNaira(z.free_threshold_kobo)}</span> : null}</span>
                    <StatusBadge kind="discount" value={z.is_active ? "active" : "disabled"} label={z.is_active ? "Delivering" : "Off"} />
                  </span>
                </summary>
                <div className="mt-4 rounded-lg bg-stone-50 p-4"><EditZone zone={z} /></div>
              </details>
            </li>
          ))}
          {zones.length === 0 && <li className="py-4 text-sm text-muted">No zones yet. Customers can&apos;t check out until you add one.</li>}
        </ul>
        <div className="mt-4"><AddZone /></div>
      </div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
