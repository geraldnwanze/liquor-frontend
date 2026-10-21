import { NextResponse } from "next/server";
import { getBranding } from "@/lib/api/catalog";
import { isIconSize, logoIconUrl } from "@/lib/brand-icon";

/**
 * Same-origin icons made from the business logo: `/brand-icon/32`, `/180`, `/192`, `/512` (add `?maskable=1` for the
 * app-icon variant with extra margin). Without a usable logo the built-in icons are served instead.
 */
export async function GET(request: Request, ctx: RouteContext<"/brand-icon/[size]">) {
  const size = Number((await ctx.params).size);
  const fallback = new URL(size >= 180 ? "/icons/icon-512.png" : "/icon.png", request.url);
  if (!isIconSize(size)) return new NextResponse(null, { status: 404 });

  const { logoUrl } = await getBranding();
  const source = logoIconUrl(logoUrl, size, new URL(request.url).searchParams.get("maskable") === "1");
  if (!source) return NextResponse.redirect(fallback, 307);

  try {
    const upstream = await fetch(source, { signal: AbortSignal.timeout(6000) });
    if (!upstream.ok || !(upstream.headers.get("content-type") ?? "").startsWith("image/")) return NextResponse.redirect(fallback, 307);
    return new NextResponse(upstream.body, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.redirect(fallback, 307);
  }
}
