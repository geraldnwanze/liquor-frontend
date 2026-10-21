"use client";

import { useActionState, useRef, useState } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { primary } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import { IDLE, type FormState } from "@/lib/auth/form-state";

const TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Upload, replace or remove one picture (a category image, a brand logo). Checked here for a quick message, and again by the API. */
export function ImageUploadPanel({ label, imageUrl, maxMb, upload, remove }: { label: string; imageUrl: string | null; maxMb: number; upload: (prev: FormState, fd: FormData) => Promise<FormState>; remove: () => Promise<FormState> }) {
  const [state, action, pending] = useActionState(upload, IDLE);
  const [problem, setProblem] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(null);
    if (!file) return setProblem(null);
    if (!TYPES.includes(file.type)) {
      setProblem("Upload a PNG, JPEG or WebP picture.");
      e.target.value = "";
    } else if (file.size > maxMb * 1024 * 1024) {
      setProblem(`The picture must be ${maxMb} MB or smaller.`);
      e.target.value = "";
    } else {
      setProblem(null);
      setPreview(URL.createObjectURL(file));
    }
  }

  const shown = preview ?? imageUrl;
  return (
    <section aria-label={label} className="mb-5 grid gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4 sm:grid-cols-[7rem_1fr]">
      <div className="grid aspect-square w-28 place-items-center overflow-hidden rounded-lg border border-stone-200 bg-white">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- staff preview straight from the API or the chosen file
          <img src={shown} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs text-muted">None yet</span>
        )}
      </div>
      <form action={action} className="grid gap-3">
        <Field label={imageUrl ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`} error={problem ?? fieldError(state, "file")} hint={`PNG, JPEG or WebP, up to ${maxMb} MB, at least 200 × 200 pixels.`}>
          {(p) => <input {...p} ref={fileRef} name="file" type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} className="w-full rounded-lg border border-stone-300 bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ivory" />}
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending || Boolean(problem)} className={primary}>{pending ? "Uploading…" : imageUrl ? "Replace" : "Upload"}</button>
          {imageUrl && <ConfirmButton label="Remove" confirmLabel="Yes, remove" tone="danger" run={remove} />}
          <FormResult state={state} />
        </div>
      </form>
    </section>
  );
}
