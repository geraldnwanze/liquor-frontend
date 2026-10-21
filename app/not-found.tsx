import Link from "next/link";

/** Fallback for URLs that match nothing (shop pages use their own, inside the shop layout). */
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-start justify-center gap-4 px-4 py-24">
      <p className="text-sm uppercase tracking-[0.2em] text-gold">404</p>
      <h1 className="text-3xl font-semibold text-accent">We couldn&apos;t find that page</h1>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-burgundy px-6 font-semibold text-ivory">Back to the shop</Link>
    </section>
  );
}
