import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/account/", "/checkout/", "/cart", "/payment/", "/offline.html"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
