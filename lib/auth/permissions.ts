import type { User } from "@/lib/api/types";

/**
 * Whether a screen or button should be shown. This is cosmetic only: the API checks every action again, so hiding
 * something here is never what protects it.
 */
export function can(user: Pick<User, "permissions"> | null | undefined, permission: string): boolean {
  const granted = user?.permissions ?? [];
  return granted.includes("*") || granted.includes(permission);
}

export function canAny(user: Pick<User, "permissions"> | null | undefined, ...permissions: string[]): boolean {
  return permissions.some((p) => can(user, p));
}
