import type { Metadata } from "next";
import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      intro="Enter your email and we'll send you a link to choose a new password."
      footer={
        <p>
          Remembered it? <AuthLink href="/login">Sign in</AuthLink>
        </p>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
