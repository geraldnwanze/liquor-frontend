import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import { PwaRoot } from "@/components/pwa/pwa-root";
import { getBranding } from "@/lib/api/catalog";
import { brand } from "@/lib/brand";
import { logoIconUrl } from "@/lib/brand-icon";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { logoUrl } = await getBranding();
  // With an uploaded logo the tab and home-screen icons are made from it; otherwise the built-in icons apply.
  const fromLogo = logoIconUrl(logoUrl, 32) !== null;
  return {
    metadataBase: new URL(brand.siteUrl),
    title: { default: brand.name, template: `%s | ${brand.name}` },
    description: brand.description,
    applicationName: brand.name,
    appleWebApp: { capable: true, title: brand.shortName, statusBarStyle: "black-translucent" },
    formatDetection: { telephone: false },
    ...(fromLogo ? { icons: { icon: [{ url: "/brand-icon/32", sizes: "32x32", type: "image/png" }], apple: [{ url: "/brand-icon/180", sizes: "180x180", type: "image/png" }] } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: brand.themeColor,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Branded launch screen for installed (standalone) mode only; hides itself after hydration. */}
        <div id="app-splash" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={96} height={96} />
          <span>{brand.name}</span>
        </div>
        <Suspense fallback={null}>
          <PwaRoot />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
