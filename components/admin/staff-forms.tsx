"use client";

import { useActionState } from "react";
import { deactivateStaffAction, inviteStaffAction, reactivateStaffAction, resendInviteAction, updateStaffRolesAction } from "@/app/actions/admin-staff";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import { permissionLabel } from "@/lib/admin/permission-labels";
import { IDLE } from "@/lib/auth/form-state";
import type { AdminRole, AdminStaffMember } from "@/lib/api/types";

function RoleChoices({ roles, chosen, error }: { roles: AdminRole[]; chosen: Set<string>; error?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Roles</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {roles.map((r) => (
          <label key={r.slug} className="flex items-start gap-2 rounded-lg border border-stone-200 p-3 text-sm">
            <input type="checkbox" name="roles" value={r.slug} defaultChecked={chosen.has(r.slug)} className="mt-0.5 size-4" />
            <span>
              <span className="block font-medium">{r.name}</span>
              <span className="block text-xs text-muted">{r.permissions.map(permissionLabel).join(" · ") || "No access"}</span>
            </span>
          </label>
        ))}
      </div>
      {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
    </fieldset>
  );
}

export function InviteStaff({ roles }: { roles: AdminRole[] }) {
  const [state, action, pending] = useActionState(inviteStaffAction, IDLE);
  return (
    <form action={action} key={state.status === "success" ? "sent" : "open"} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" error={fieldError(state, "name")}>{(p) => <input name="name" required maxLength={120} className={input} {...p} />}</Field>
        <Field label="Email" error={fieldError(state, "email")} hint="They get a link to set their own password.">{(p) => <input name="email" type="email" required maxLength={190} className={input} {...p} />}</Field>
      </div>
      <RoleChoices roles={roles} chosen={new Set()} error={fieldError(state, "roles")} />
      <div className="flex flex-col gap-2"><button disabled={pending} className={`${primary} self-start`}>{pending ? "Sending…" : "Send invitation"}</button><FormResult state={state} /></div>
    </form>
  );
}

export function EditStaff({ member, roles, isSelf }: { member: AdminStaffMember; roles: AdminRole[]; isSelf: boolean }) {
  const [state, action, pending] = useActionState(updateStaffRolesAction.bind(null, member.id), IDLE);
  const chosen = new Set(member.roles.map((r) => r.slug));
  return (
    <div className="space-y-5">
      {isSelf ? (
        <p className="text-sm text-muted">This is you. You can&apos;t change your own roles or deactivate yourself; ask another super administrator.</p>
      ) : (
        <form action={action} className="space-y-4">
          <RoleChoices roles={roles} chosen={chosen} error={fieldError(state, "roles")} />
          <div className="flex flex-col gap-2"><button disabled={pending} className={`${primary} self-start`}>{pending ? "Saving…" : "Save roles"}</button><FormResult state={state} /></div>
        </form>
      )}
      {!isSelf && (
        <div className="flex flex-wrap items-start gap-3 border-t border-stone-200 pt-4">
          {member.is_active ? (
            <>
              <ConfirmButton label="Resend invitation" confirmLabel="Yes, send it" run={() => resendInviteAction(member.id)} />
              <ConfirmButton tone="danger" label="Deactivate" confirmLabel="Yes, deactivate and sign out" run={() => deactivateStaffAction(member.id)} />
            </>
          ) : (
            <ConfirmButton label="Reactivate" confirmLabel="Yes, reactivate" run={() => reactivateStaffAction(member.id)} />
          )}
        </div>
      )}
    </div>
  );
}

