import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
  // The reset token is in this URL: never leak it to other sites through the Referer header.
  referrer: "no-referrer",
};

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <Suspense fallback={<AuthShell title="Choose a new password">{null}</AuthShell>}>
      <Reset searchParams={searchParams} />
    </Suspense>
  );
}

async function Reset({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const email = typeof params.email === "string" ? params.email : "";

  if (!token || !email) {
    return (
      <AuthShell title="This link isn't valid" footer={<AuthLink href="/forgot-password">Request a new reset link</AuthLink>}>
        <p className="text-sm">The reset link is missing information. Open the link from your email again, or request a new one.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <ResetForm token={token} email={email} />
    </AuthShell>
  );
}
