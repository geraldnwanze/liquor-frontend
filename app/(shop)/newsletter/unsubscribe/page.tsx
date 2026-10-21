import type { Metadata } from "next";
import { Suspense } from "react";
import { unsubscribeNewsletterAction } from "@/app/actions/engagement";
import { TokenAction } from "@/components/newsletter/token-action";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

async function Body({ searchParams }: { searchParams: PageProps<"/newsletter/unsubscribe">["searchParams"] }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  return token ? <TokenAction token={token} action={unsubscribeNewsletterAction} label="Unsubscribe me" /> : <p role="alert" className="text-danger">This link is not valid.</p>;
}

export default function Page({ searchParams }: PageProps<"/newsletter/unsubscribe">) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
      <h1 className="text-4xl">Unsubscribe</h1>
      <p className="mt-3 text-muted">Press the button and we&apos;ll stop sending you news and offers.</p>
      <div className="mt-8">
        <Suspense>
          <Body searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
