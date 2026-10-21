import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/api/account";
import { safeNext } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: false } };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <Suspense fallback={<AuthShell title="Create an account">{null}</AuthShell>}>
      <Register searchParams={searchParams} />
    </Suspense>
  );
}

async function Register({ searchParams }: Pick<PageProps<"/register">, "searchParams">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell
      title="Create an account"
      intro="Track your orders and save delivery addresses. You can always check out as a guest instead."
      footer={
        <p>
          Already have an account? <AuthLink href={next === "/account" ? "/login" : `/login?next=${encodeURIComponent(next)}`}>Sign in</AuthLink>
        </p>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
