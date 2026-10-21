"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24" role="alert">
      <h1 className="text-3xl font-semibold text-accent">Something went wrong</h1>
      <p className="text-muted">We couldn&apos;t load this page. Check your connection and try again.</p>
      <button onClick={reset} className="min-h-11 rounded-full bg-burgundy px-6 font-semibold text-ivory">
        Try again
      </button>
    </section>
  );
}
