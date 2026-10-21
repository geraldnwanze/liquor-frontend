import { useId } from "react";

export const inputClass =
  "min-h-12 w-full rounded-lg border border-ink/40 bg-white px-3 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger";

type ControlProps = { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined };

/** Label + control + hint/error wiring (ids, aria-invalid, aria-describedby) in one place. */
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (props: ControlProps) => React.ReactNode }) {
  const id = useId();
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
