/**
 * Where the browser may be sent to pay. The URL comes from our own API (which got it from the gateway), but it is
 * still checked before navigating: only https pages, or a path on this very site (the development simulator).
 * Anything else (javascript:, data:, other schemes, plain http to another host) is refused.
 */
export function safeGatewayUrl(url: string | undefined | null, siteOrigin: string): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url, siteOrigin);
  } catch {
    return null;
  }
  if (parsed.origin === siteOrigin) return parsed.toString();
  return parsed.protocol === "https:" ? parsed.toString() : null;
}
