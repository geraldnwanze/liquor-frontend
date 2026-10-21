import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Photo uploads go through a Server Action; the default 1 MB limit would reject normal phone photos. A review can carry
    // three photos of up to 5 MB each, so this must stay above 15 MB.
    serverActions: { bodySizeLimit: "16mb" },
  },
  cacheComponents: true,
  images: {
    // Hosts allowed for product images (comma-separated). A bare hostname means https; use a full address such as
    // http://localhost:8010 for a local API. Uploaded photos are served from the API (or its CDN), so list that host.
    remotePatterns: (process.env.IMAGE_HOSTS ?? "res.cloudinary.com")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean)
      .map((entry) => {
        if (!entry.includes("://")) return { protocol: "https" as const, hostname: entry };
        const url = new URL(entry);
        return { protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname, ...(url.port ? { port: url.port } : {}) };
      }),
    // Next refuses to fetch images from private addresses (an SSRF guard). Local development against
    // http://localhost needs this switched on; never set it in production.
    dangerouslyAllowLocalIP: process.env.IMAGE_ALLOW_LOCAL_IP === "1",
  },
  async headers() {
    return [
      {
        // The worker must always be revalidated so updates are discovered promptly.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  // Off on purpose: with it on, the first visit to an unlisted URL is served an app shell with HTTP 200 (a soft 404),
  // and /old-category does not 308 until the second request. Real status codes matter for SEO. Trade-off: no
  // app-shell prefetch for soft navigations. Revisit if Next removes this option (use a Proxy slug check instead).
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
