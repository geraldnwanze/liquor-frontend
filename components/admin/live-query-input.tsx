"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/**
 * The search box on an admin list page. It keeps working as a plain form field (Enter still submits), and on every
 * key release it also puts the text into the address bar's `q` and lets the server re-render the list, so results
 * update as you type. Other filters in the address (status, category, dates) are kept; the page number is reset. A
 * newer keystroke replaces an unfinished earlier one, so a slow answer can't overwrite a newer one.
 */
export function LiveQueryInput({ defaultValue, placeholder, className, "aria-label": ariaLabel }: { defaultValue: string; placeholder: string; className: string; "aria-label"?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useSearchParams();
  const [pending, startTransition] = useTransition();

  function search(value: string) {
    const text = value.replace(/\s+/g, " ").trim().slice(0, 100);
    if (text === (current.get("q") ?? "")) return;
    const params = new URLSearchParams(current.toString());
    if (text) params.set("q", text);
    else params.delete("q");
    params.delete("page");
    startTransition(() => router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false }));
  }

  return (
    <>
      <input
        name="q"
        type="search"
        autoComplete="off"
        maxLength={100}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={className}
        onInput={(e) => search(e.currentTarget.value)}
        onKeyUp={(e) => search(e.currentTarget.value)}
      />
      <span role="status" className="sr-only">{pending ? "Updating results" : ""}</span>
    </>
  );
}
