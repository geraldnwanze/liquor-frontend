import Link from "next/link";

/** Narrow centred card used by the sign-in, register and reset pages. */
export function AuthShell({ title, intro, children, footer }: { title: string; intro?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-3xl font-semibold text-accent">{title}</h1>
      {intro && <div className="mt-2 text-muted">{intro}</div>}
      <div className="mt-6 rounded-2xl border border-burgundy/15 bg-white p-5">{children}</div>
      {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-accent underline underline-offset-4">
      {children}
    </Link>
  );
}
