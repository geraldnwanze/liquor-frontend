/**
 * Brand defaults used by the manifest, metadata and PWA UI.
 * Override per deployment with NEXT_PUBLIC_* variables. These are intended to be replaced by
 * values from the Laravel CMS settings once that endpoint exists.
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Premium Liquor",
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? "Liquor",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    "Wine, whiskey, rum, gin and more from a premium Nigerian spirits retailer.",
  themeColor: process.env.NEXT_PUBLIC_THEME_COLOR ?? "#0f0b0a",
  backgroundColor: process.env.NEXT_PUBLIC_BACKGROUND_COLOR ?? "#0f0b0a",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
