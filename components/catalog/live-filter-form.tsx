"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * The storefront filter form, made live. It is still a plain GET form (Enter and the Apply button work, and it works
 * without JavaScript), but every key release or change also writes the fields into the address and lets the server
 * re-render the results, so the list follows what you type. Empty fields are left out, the page number is reset, and
 * a newer change replaces an unfinished earlier one.
 */
export function LiveFilterForm({ basePath, className, children }: { basePath: string; className: string; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(form: HTMLFormElement) {
    const params = new URLSearchParams();
    for (const [key, raw] of new FormData(form).entries()) {
      const value = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
      if (value && !(key === "sort" && value === "newest")) params.set(key, value);
    }
    const next = params.size ? `${basePath}?${params}` : basePath;
    if (next === `${window.location.pathname}${window.location.search}`) return;
    startTransition(() => router.replace(next, { scroll: false }));
  }

  return (
    <form
      method="get"
      action={basePath}
      role="search"
      className={className}
      onInput={(e) => update(e.currentTarget)}
      onChange={(e) => update(e.currentTarget)}
      onKeyUp={(e) => update(e.currentTarget)}
    >
      {children}
      <span role="status" className="sr-only">{pending ? "Updating results" : ""}</span>
    </form>
  );
}
