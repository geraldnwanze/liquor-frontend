import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader, panel } from "@/components/admin/page-header";
import { LogoPanel } from "@/components/admin/logo-panel";
import { SettingsForm } from "@/components/admin/settings-form";
import { SettingsTabs } from "@/components/admin/settings-tabs";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminSettings } from "@/lib/api/types";
import { can } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const user = await requireStaff("/admin/settings", "settings.manage", "shipping.manage");
  // Roles that can only manage delivery go straight to it.
  if (!can(user, "settings.manage")) redirect("/admin/settings/delivery");
  const { data } = await adminGet<{ data: AdminSettings }>("/settings");
  if (!data) return <p role="alert">Settings could not be loaded.</p>;

  return (
    <>
      <PageHeader title="Settings" subtitle="Changes apply to the shop and to new receipts straight away." />
      <SettingsTabs current="general" canSettings canZones={can(user, "shipping.manage")} />
      <div className={`${panel} mb-5 p-5`}><LogoPanel logoUrl={data.data.business.logo_url} businessName={data.data.business.name ?? data.data.defaults.business_name} /></div>
      <div className={`${panel} p-5`}><SettingsForm settings={data.data} /></div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
