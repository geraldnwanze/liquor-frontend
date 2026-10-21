"use client";

import { useActionState, useRef, useState } from "react";
import { makeMainImageAction, deleteImageAction, updateImageAction, uploadImageAction } from "@/app/actions/admin-catalog";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FormResult, fieldError } from "@/components/admin/form-result";
import { input, primary, secondary } from "@/components/admin/form-styles";
import { Field } from "@/components/ui/field";
import { IDLE } from "@/lib/auth/form-state";

type Image = { id: string; url: string; alt: string | null; sort_order: number };

const MAX_PHOTOS = 10;

function ImageRow({ productId, image, isMain }: { productId: string; image: Image; isMain: boolean }) {
  const [state, action, pending] = useActionState(updateImageAction.bind(null, productId, image.id), IDLE);
  return (
    <li className="grid gap-4 py-4 sm:grid-cols-[8rem_1fr]">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- staff preview straight from the API */}
        <img src={image.url} alt={image.alt ?? ""} className="aspect-square w-32 rounded-lg border border-stone-200 bg-stone-50 object-contain" />
        {isMain && <span className="absolute left-1.5 top-1.5 rounded-full bg-burgundy px-2 py-0.5 text-[11px] font-medium text-ivory">Main image</span>}
      </div>
      <div className="flex flex-col gap-3">
        <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Description for screen readers" error={fieldError(state, "alt")} hint={image.alt ? undefined : "Describe what the photo shows, e.g. “Bottle of Demo Dark Rum on a bar”."}>
            {(p) => <input name="alt" maxLength={190} defaultValue={image.alt ?? ""} className={input} {...p} />}
          </Field>
          <button disabled={pending} className={secondary}>{pending ? "Saving…" : "Save description"}</button>
        </form>
        <FormResult state={state} />
        <div className="flex flex-wrap items-start gap-3">
          {!isMain && <ConfirmButton label="Make main image" confirmLabel="Yes, make it the main image" run={() => makeMainImageAction(productId, image.id)} />}
          <ConfirmButton tone="danger" label="Remove" confirmLabel="Yes, remove photo" run={() => deleteImageAction(productId, image.id)} />
        </div>
      </div>
    </li>
  );
}

export function ImagesPanel({ productId, images }: { productId: string; images: Image[] }) {
  const [state, action, pending] = useActionState(uploadImageAction.bind(null, productId), IDLE);
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const full = images.length >= MAX_PHOTOS;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setLocalError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setLocalError("Upload a JPEG, PNG or WebP photo.");
      e.target.value = "";
    } else if (file.size > 5 * 1024 * 1024) {
      setLocalError("That photo is over 5 MB. Choose a smaller one, or export it at a lower quality.");
      e.target.value = "";
    } else {
      setPreview(URL.createObjectURL(file));
    }
  }

  return (
    <div>
      <ul className="divide-y divide-stone-100">
        {sorted.map((img, i) => <ImageRow key={img.id} productId={productId} image={img} isMain={i === 0} />)}
        {images.length === 0 && <li className="py-3 text-sm text-muted">No photos yet. The shop shows a bottle illustration until you add one.</li>}
      </ul>

      <form
        action={async (fd) => {
          await action(fd);
          if (fileRef.current) fileRef.current.value = "";
          setPreview(null);
        }}
        className="mt-4 grid gap-3 border-t border-stone-200 pt-4 sm:grid-cols-[1fr_1fr]"
      >
        <Field label="Photo" error={localError ?? fieldError(state, "file")} hint="JPEG, PNG or WebP, between 400 and 4500 pixels, up to 5 MB. It is resized to 1600 pixels and saved as WebP.">
          {(p) => <input ref={fileRef} type="file" name="file" accept="image/jpeg,image/png,image/webp" required disabled={full} onChange={onPick} className={`${input} h-auto py-2 file:mr-3 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium`} {...p} />}
        </Field>
        <Field label="Description for screen readers" error={fieldError(state, "alt")} hint="Optional, but it helps shoppers who can't see the photo.">
          {(p) => <input name="alt" maxLength={190} className={input} {...p} />}
        </Field>
        {preview && (
          <div className="sm:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file */}
            <img src={preview} alt="Preview of the photo you chose" className="h-32 w-32 rounded-lg border border-stone-200 object-contain" />
          </div>
        )}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <button disabled={pending || full || Boolean(localError)} className={`${primary} self-start`}>{pending ? "Uploading…" : "Upload photo"}</button>
          {full && <p className="text-sm text-muted">A product can have up to {MAX_PHOTOS} photos. Remove one to add another.</p>}
          <FormResult state={state} />
        </div>
      </form>
    </div>
  );
}
