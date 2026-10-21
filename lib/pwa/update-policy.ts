/** Routes where a service-worker update prompt (and any reload) must never interrupt the customer. */
const PROTECTED_PREFIXES = ["/checkout", "/payment", "/payments", "/cart", "/orders"];

export function isUpdateDeferred(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
