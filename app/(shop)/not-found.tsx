import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24">
      <p className="text-sm uppercase tracking-[0.2em] text-gold">404</p>
      <h1 className="text-3xl font-semibold text-accent">We couldn&apos;t find that page</h1>
      <p className="text-muted">The product or category may have been moved or is no longer available.</p>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-gold px-6 font-semibold text-midnight transition hover:bg-[#dcb86e]">
        Back to the shop
      </Link>
    </section>
  );
}
