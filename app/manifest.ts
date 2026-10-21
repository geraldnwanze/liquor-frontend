import type { MetadataRoute } from "next";
import { getBranding } from "@/lib/api/catalog";
import { brand } from "@/lib/brand";
import { logoIconUrl } from "@/lib/brand-icon";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { logoUrl } = await getBranding();
  const fromLogo = logoIconUrl(logoUrl, 192) !== null;
  return {
    id: "/",
    name: brand.name,
    short_name: brand.shortName,
    description: brand.description,
    // Same URL as the website: installed and browser versions share one canonical URL.
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: brand.backgroundColor,
    theme_color: brand.themeColor,
    lang: "en-NG",
    dir: "ltr",
    categories: ["shopping", "food"],
    icons: fromLogo
      ? [
          { src: "/brand-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/brand-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/brand-icon/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ]
      : [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
  };
}
