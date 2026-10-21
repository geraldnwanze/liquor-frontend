import type { Metadata } from "next";
import { Suspense } from "react";
import { confirmNewsletterAction } from "@/app/actions/engagement";
import { TokenAction } from "@/components/newsletter/token-action";

export const metadata: Metadata = { title: "Confirm your subscription", robots: { index: false } };

async function Body({ searchParams }: { searchParams: PageProps<"/newsletter/confirm">["searchParams"] }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  return token ? <TokenAction token={token} action={confirmNewsletterAction} label="Confirm subscription" /> : <p role="alert" className="text-danger">This link is not valid.</p>;
}

export default function Page({ searchParams }: PageProps<"/newsletter/confirm">) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <h1 className="text-4xl">Confirm your subscription</h1>
      <p className="mt-3 text-muted">Press the button to confirm this email address and start receiving news and offers.</p>
      <div className="mt-8">
        <Suspense>
          <Body searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
