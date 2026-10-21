import type { Metadata } from "next";
import { DeleteAccountPanel } from "@/components/account/delete-account-panel";
import { PasswordForm } from "@/components/account/password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { accountGet, requireUser } from "@/lib/api/account";

export const metadata: Metadata = { title: "Your details" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const deletion = await accountGet<{ data: { requested_at: string } | null }>("/me/deletion-request");

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section aria-labelledby="details-heading">
        <h2 id="details-heading" className="text-2xl font-semibold text-accent">
          Hello, {user.name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-muted">Keep your details up to date so deliveries go smoothly.</p>
        <div className="mt-5 rounded-2xl border border-burgundy/15 bg-white p-5">
          <ProfileForm user={user} />
        </div>
      </section>
      <section aria-labelledby="password-heading">
        <h2 id="password-heading" className="text-2xl font-semibold text-accent">
          Password
        </h2>
        <p className="mt-1 text-muted">Changing it signs you out on your other devices.</p>
        <div className="mt-5 rounded-2xl border border-burgundy/15 bg-white p-5">
          <PasswordForm />
        </div>
      </section>
      <section aria-labelledby="delete-heading" className="lg:col-span-2">
        <h2 id="delete-heading" className="text-2xl font-semibold text-accent">
          Delete my account
        </h2>
        <div className="mt-5 rounded-2xl border border-burgundy/15 bg-white p-5">
          <DeleteAccountPanel pendingSince={deletion.data?.data?.requested_at ?? null} />
        </div>
      </section>
    </div>
  );
}
