import type { Metadata } from "next";
import { PageHeader, panel } from "@/components/admin/page-header";
import { EditStaff, InviteStaff } from "@/components/admin/staff-forms";
import { adminGet, requireStaff } from "@/lib/api/admin";
import type { AdminRole, AdminStaffMember } from "@/lib/api/types";
import { permissionLabel } from "@/lib/admin/permission-labels";
import { LiveFilter } from "@/components/admin/live-filter";

export const metadata: Metadata = { title: "Staff" };

const card = `${panel} p-5`;
const heading = "text-sm font-semibold uppercase tracking-wider text-muted";

export default async function AdminStaff() {
  const me = await requireStaff("/admin/staff", "staff.manage");
  const [staff, roles] = await Promise.all([
    adminGet<{ data: AdminStaffMember[] }>("/staff"),
    adminGet<{ data: AdminRole[] }>("/roles"),
  ]);
  if (!staff.data || !roles.data) return <p role="alert">Staff could not be loaded.</p>;
  const members = staff.data.data;
  const roleList = roles.data.data;

  return (
    <>
      <PageHeader title="Staff and roles" subtitle="Who can sign in to the admin, and what they can do. Only super administrators see this page." />

      <div className="space-y-6">
        <section className={card} aria-labelledby="team-h">
          <h2 id="team-h" className={`${heading} mb-2`}>Team</h2>
          <LiveFilter targetId="team-list" label="Filter staff" placeholder="Filter by name, email or role" />
          <ul id="team-list" className="divide-y divide-stone-100">
            {members.map((m) => (
              <li key={m.id} data-filter-item data-filter-text={`${m.name} ${m.email} ${m.roles.map((r) => r.name).join(" ")}${m.is_active ? "" : " deactivated"}`} className="py-3">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm">
                    <span><span className="font-medium">{m.name}</span>{m.id === me.id && <span className="ml-2 text-xs text-muted">(you)</span>}<span className="block text-xs text-muted">{m.email}</span></span>
                    <span className="flex flex-wrap items-center gap-2">
                      {m.roles.map((r) => <span key={r.slug} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs">{r.name}</span>)}
                      {!m.is_active && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900">Deactivated</span>}
                    </span>
                  </summary>
                  <div className="mt-4 rounded-lg bg-stone-50 p-4"><EditStaff member={m} roles={roleList} isSelf={m.id === me.id} /></div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <section className={card} aria-labelledby="invite-h">
          <h2 id="invite-h" className={`${heading} mb-4`}>Invite someone</h2>
          <InviteStaff roles={roleList} />
        </section>

        <section className={card} aria-labelledby="roles-h">
          <h2 id="roles-h" className={`${heading} mb-3`}>What each role can do</h2>
          <dl className="space-y-3 text-sm">
            {roleList.map((r) => (
              <div key={r.slug}><dt className="font-medium">{r.name}</dt><dd className="text-muted">{r.permissions.map(permissionLabel).join(" · ") || "No access"}</dd></div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted">Roles are fixed. Combine several to give someone a wider job. Changes apply immediately; deactivating signs a person out everywhere.</p>
        </section>
      </div>
    </>
  );
}

// Per-person data behind a sign-in: a blocking route by design (no prerendered shell).
export const instant = false;
