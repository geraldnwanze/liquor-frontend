import Link from "next/link";

/** Sub-navigation for the settings area. Which tabs show depends on the role; the API enforces it either way. */
export function SettingsTabs({ current, canSettings, canZones }: { current: "general" | "delivery"; canSettings: boolean; canZones: boolean }) {
  const tabs = [
    canSettings && { id: "general", href: "/admin/settings", label: "Business and limits" },
    canZones && { id: "delivery", href: "/admin/settings/delivery", label: "Delivery zones" },
  ].filter(Boolean) as { id: string; href: string; label: string }[];
  return (
    <nav aria-label="Settings" className="mb-5 flex gap-2">
      {tabs.map((t) => (
        <Link key={t.id} href={t.href} aria-current={t.id === current ? "page" : undefined}
          className={`inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium ${t.id === current ? "border-burgundy bg-burgundy text-ivory" : "border-stone-300 bg-white hover:bg-stone-50"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
