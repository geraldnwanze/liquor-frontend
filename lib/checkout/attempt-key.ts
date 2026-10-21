/**
 * Idempotency keys for checkout. One key per distinct submission: retrying the *same* details (e.g. after the
 * connection dropped) reuses the key so the server can safely replay; changing any field makes a new key, because
 * the server rejects one key with two different bodies.
 */
export function newAttemptKey(): string {
  return crypto.randomUUID();
}

export function isValidAttemptKey(key: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(key);
}
