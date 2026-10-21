"use client";

import { useActionState } from "react";
import { saveHomepageAction } from "@/app/actions/admin-homepage";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import type { HomepageContent } from "@/lib/api/types";
import { IDLE } from "@/lib/auth/form-state";

const SECTIONS: [keyof HomepageContent, string][] = [
  ["show_best_sellers", "Best sellers (appears once something has sold)"],
  ["show_new_arrivals", "New arrivals"],
  ["show_on_sale", "Reduced right now (appears when something is on sale)"],
  ["show_how_it_works", "“From shelf to door” steps"],
  ["show_promises", "Payment, tracking and adults-only reassurance"],
];

export function HomepageForm({ content }: { content: HomepageContent }) {
  const [state, action, pending] = useActionState(saveHomepageAction, IDLE);
  const err = (k: string) => fieldError(state, k);
  const text = (k: keyof HomepageContent) => (content[k] as string | null) ?? "";

  return (
    <form action={action} className="grid gap-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-semibold">Announcement strip</legend>
        <div className="sm:col-span-2 -mt-1 text-sm text-muted">The thin line above every page. Leave empty for the shop&apos;s standard message.</div>
        <Field label="Message" error={err("announcement_text")}>{(p) => <input name="announcement_text" maxLength={160} defaultValue={text("announcement_text")} className={input} {...p} />}</Field>
        <Field label="Link (optional)" error={err("announcement_link")} hint="A site address like /search, or https://…">{(p) => <input name="announcement_link" maxLength={300} defaultValue={text("announcement_link")} className={input} {...p} />}</Field>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-semibold">Top of the home page</legend>
        <div className="sm:col-span-2 -mt-1 text-sm text-muted">Anything left empty uses the shop&apos;s built-in wording.</div>
        <Field label="Small line above the headline" error={err("hero_eyebrow")}>{(p) => <input name="hero_eyebrow" maxLength={60} defaultValue={text("hero_eyebrow")} className={input} {...p} />}</Field>
        <Field label="Headline" error={err("hero_title")}>{(p) => <input name="hero_title" maxLength={120} defaultValue={text("hero_title")} className={input} {...p} />}</Field>
        <Field label="Highlighted phrase after the headline" error={err("hero_title_emphasis")} hint="Shown in gold italics.">{(p) => <input name="hero_title_emphasis" maxLength={80} defaultValue={text("hero_title_emphasis")} className={input} {...p} />}</Field>
        <div className="sm:col-span-2"><Field label="Short description" error={err("hero_text")}>{(p) => <input name="hero_text" maxLength={300} defaultValue={text("hero_text")} className={input} {...p} />}</Field></div>
        <Field label="Main button: words" error={err("hero_primary_label")}>{(p) => <input name="hero_primary_label" maxLength={40} defaultValue={text("hero_primary_label")} className={input} {...p} />}</Field>
        <Field label="Main button: goes to" error={err("hero_primary_href")} hint="/search, /spirits, or https://…">{(p) => <input name="hero_primary_href" maxLength={300} defaultValue={text("hero_primary_href")} className={input} {...p} />}</Field>
        <Field label="Second button: words" error={err("hero_secondary_label")}>{(p) => <input name="hero_secondary_label" maxLength={40} defaultValue={text("hero_secondary_label")} className={input} {...p} />}</Field>
        <Field label="Second button: goes to" error={err("hero_secondary_href")}>{(p) => <input name="hero_secondary_href" maxLength={300} defaultValue={text("hero_secondary_href")} className={input} {...p} />}</Field>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-lg font-semibold">Sections to show</legend>
        <div className="grid gap-1">
          {SECTIONS.map(([key, label]) => (
            <label key={key} className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" name={key} defaultChecked={Boolean(content[key])} className="size-5" /> {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className={primary}>{pending ? "Saving…" : "Save home page"}</button>
        <FormResult state={state} />
      </div>
    </form>
  );
}
