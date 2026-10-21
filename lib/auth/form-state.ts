/** State returned by auth/account Server Actions used with useActionState. Plain data only. */
export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]>; /** Non-secret values to keep in the form (never passwords). */ values?: Record<string, string> }
  | { status: "success"; message?: string; redirectTo?: string };

export const IDLE: FormState = { status: "idle" };
