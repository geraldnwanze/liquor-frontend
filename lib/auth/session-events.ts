/**
 * Signals that the customer signed in or out in this tab. Components whose content depends on who is signed in
 * (header link, cart) listen and refresh themselves. This must not rely on a full page reload happening: browsers
 * and routers may treat a same-origin navigation as an in-page one, which would leave signed-out state on screen.
 */
export const SESSION_CHANGED = "lq:session-changed";

export function announceSessionChange(): void {
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function onSessionChange(listener: () => void): () => void {
  window.addEventListener(SESSION_CHANGED, listener);
  return () => window.removeEventListener(SESSION_CHANGED, listener);
}
