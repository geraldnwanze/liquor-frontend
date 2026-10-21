"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { deleteMyReviewAction, getReviewEligibilityAction, submitReviewAction, type ReviewEligibility } from "@/app/actions/engagement";
import { Field, inputClass } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";

const signedIn = () => document.cookie.split("; ").includes("lq_has_session=1");

/**
 * Appears only for someone who bought the product. The page itself is shared HTML, so who the visitor is gets
 * worked out in the browser; the API decides for real when the review is submitted.
 */
export function ReviewForm({ slug }: { slug: string }) {
  const [state, setState] = useState<"loading" | "guest" | ReviewEligibility>("loading");
  const [removing, startRemove] = useTransition();
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [form, action, pending] = useActionState(submitReviewAction.bind(null, slug), IDLE);

  useEffect(() => {
    let live = true;
    (async () => {
      const result = signedIn() ? await getReviewEligibilityAction(slug) : "guest";
      if (live) setState(result ?? "guest");
    })();
    return () => {
      live = false;
    };
  }, [slug]);

  if (state === "loading") return null;
  if (state === "guest") {
    return (
      <p className="text-sm text-muted">
        Bought this? <Link href={`/login?next=${encodeURIComponent(`/products/${slug}`)}`} className="text-accent underline underline-offset-4">Sign in</Link> to share what you think.
      </p>
    );
  }
  if (state?.review) {
    return (
      <div className="rounded-xl border border-gold/15 bg-white p-4 text-sm">
        <p className="text-muted">
          {state.review.status === "pending" ? "Thanks! Your review is waiting for approval." : state.review.status === "approved" ? "You've reviewed this product. Thank you!" : "Your review wasn't published."}
        </p>
        <button type="button" disabled={removing} onClick={() => startRemove(async () => { const r = await deleteMyReviewAction(slug); if (r.status === "success") setState({ can_review: true, review: null }); })} className="mt-3 min-h-11 rounded-full border border-gold/40 px-5 font-medium text-accent hover:bg-gold/10 disabled:opacity-60">
          {removing ? "Removing…" : "Delete my review"}
        </button>
      </div>
    );
  }
  if (form.status === "success") return <p role="status" className="rounded-xl border border-gold/15 bg-white p-4 text-sm">{form.message}</p>;
  if (!state?.can_review) return <p className="text-sm text-muted">Only customers who have bought this product can review it.</p>;

  const errors = form.status === "error" ? (form.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-gold/15 bg-white p-5">
      <h3 className="font-display text-xl text-accent">Write a review</h3>
      <fieldset>
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} className="has-[:checked]:border-gold has-[:checked]:bg-gold/10 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-gold/25 px-4 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold">
              <input type="radio" name="rating" value={n} required className="sr-only" />
              {n} {n === 1 ? "star" : "stars"}
            </label>
          ))}
        </div>
        {errors.rating?.[0] && <p className="mt-1 text-sm text-danger">{errors.rating[0]}</p>}
      </fieldset>
      <Field label="Headline (optional)" error={errors.title?.[0]}>
        {(p) => <input {...p} name="title" maxLength={120} className={inputClass} />}
      </Field>
      <Field label="Your review" hint="At least 10 characters. Our team approves reviews before they appear." error={errors.body?.[0]}>
        {(p) => <textarea {...p} name="body" required minLength={10} maxLength={2000} rows={4} className={`${inputClass} py-2`} />}
      </Field>
      <Field label="Photos (optional)" hint="Up to 3 JPEG, PNG or WebP photos, 5 MB each." error={photoNote ?? errors.photos?.[0]}>
        {(p) => (
          <input
            {...p}
            type="file"
            name="photos"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              const problem = files.length > 3 ? "Choose up to 3 photos." : files.some((f) => f.size > 5 * 1024 * 1024) ? "Each photo must be 5 MB or smaller." : null;
              setPhotoNote(problem);
              if (problem) e.target.value = "";
            }}
            className={`${inputClass} py-2 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-1.5 file:font-medium file:text-midnight`}
          />
        )}
      </Field>
      {form.status === "error" && !Object.keys(errors).length && <p role="alert" className="text-sm text-danger">{form.message}</p>}
      <button disabled={pending} className="min-h-12 justify-self-start rounded-full bg-gold px-7 font-semibold text-midnight transition hover:bg-[#dcb86e] disabled:opacity-60">
        {pending ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}
