import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/api/account";
import { safeNext } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthShell title="Sign in">{null}</AuthShell>}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  // Already signed in (verified with the API, so an expired cookie can't cause a redirect loop).
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell
      title="Sign in"
      intro={params.reset ? <p role="status" className="rounded-lg bg-white p-3 text-sm text-emerald-400">Your password has been reset. Sign in with your new password.</p> : null}
      footer={
        <p>
          New here? <AuthLink href={next === "/account" ? "/register" : `/register?next=${encodeURIComponent(next)}`}>Create an account</AuthLink>
        </p>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
