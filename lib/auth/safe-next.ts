/**
 * Where to send someone after signing in. Only same-site paths are allowed: anything that could leave our origin
 * (absolute URLs, protocol-relative `//host`, backslash tricks, control characters) falls back to the default,
 * so a crafted login link can never become an open redirect.
 */
export function safeNext(input: string | string[] | null | undefined, fallback = "/account"): string {
  const value = Array.isArray(input) ? input[0] : input;
  if (typeof value !== "string" || value.length === 0 || value.length > 300) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\x00-\x1f\x7f\\]/.test(value)) return fallback;
  // Never bounce back into the auth pages themselves.
  if (/^\/(login|register|forgot-password|reset-password)(\/|\?|$)/.test(value)) return fallback;
  return value;
}
