import type { Metadata } from "next";

// The staff portal is its own small app: nothing from the shop (no header, cart or theme), never indexed or cached.
export const metadata: Metadata = { title: { default: "Staff sign in", template: "%s | Staff" }, robots: { index: false, follow: false } };

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh items-center justify-center bg-midnight px-4 py-10 text-white">{children}</div>;
}
