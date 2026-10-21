"use client";

import { useActionState, useRef, useState } from "react";
import { removeLogoAction, uploadLogoAction } from "@/app/actions/admin-settings";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { primary } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";

const TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

/** Upload, replace or remove the business logo. Checked here for a quick message, and again by the API. */
export function LogoPanel({ logoUrl, businessName }: { logoUrl: string | null; businessName: string }) {
  const [state, action, pending] = useActionState(uploadLogoAction, IDLE);
  const [problem, setProblem] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(null);
    if (!file) return setProblem(null);
    if (!TYPES.includes(file.type)) {
      setProblem("Upload a PNG, JPEG or WebP logo.");
      e.target.value = "";
    } else if (file.size > MAX_BYTES) {
      setProblem("The logo must be 2 MB or smaller.");
      e.target.value = "";
    } else {
      setProblem(null);
      setPreview(URL.createObjectURL(file));
    }
  }

  const shown = preview ?? logoUrl;
  return (
    <section aria-labelledby="logo-h" className="grid gap-5 sm:grid-cols-[10rem_1fr]">
      <div className="grid aspect-square w-40 place-items-center overflow-hidden rounded-xl border border-stone-200 bg-[repeating-conic-gradient(#f3f0eb_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- staff preview straight from the API or the chosen file
          <img src={shown} alt={`${businessName} logo`} className="max-h-full max-w-full object-contain p-2" />
        ) : (
          <span className="px-3 text-center text-xs text-muted">No logo yet</span>
        )}
      </div>
      <div>
        <h2 id="logo-h" className="text-lg font-semibold">Business logo</h2>
        <p className="mt-1 text-sm text-muted">Shown in the shop header and footer, on receipts and in this admin. PNG, JPEG or WebP, up to 2 MB, at least 100 × 100 pixels. A transparent PNG works best.</p>
        <form action={action} className="mt-4 grid gap-3">
          <Field label={logoUrl ? "Replace the logo" : "Choose a logo"} error={problem ?? fieldError(state, "file")}>
            {(p) => <input {...p} ref={fileRef} name="file" type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} className="w-full rounded-lg border border-stone-300 bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ivory" />}
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={pending || Boolean(problem)} className={primary}>{pending ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}</button>
            {logoUrl && <ConfirmButton label="Remove logo" confirmLabel="Yes, remove" tone="danger" run={removeLogoAction} />}
            <FormResult state={state} />
          </div>
        </form>
      </div>
    </section>
  );
}
