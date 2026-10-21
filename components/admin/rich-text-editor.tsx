"use client";

import { useId, useRef, useState } from "react";
import { uploadPageImageAction } from "@/app/actions/admin-pages";
import { textarea } from "@/components/admin/form-styles";
import { RichText } from "@/components/content/rich-text";
import { insertBlock, linkSelection, prefixLines, wrapSelection, type Edit } from "@/lib/markdown-edit";

const button = "h-9 min-w-9 rounded-md border border-stone-300 bg-white px-2.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-60";

/** A text box with a formatting toolbar, a live preview and picture upload, for page content. Saves plain Markdown text. */
export function RichTextEditor({ name, defaultValue, required, invalid, label }: { name: string; defaultValue: string; required?: boolean; invalid?: boolean; label: string }) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function apply(make: (text: string, start: number, end: number) => Edit) {
    const el = area.current;
    if (!el) return;
    const edit = make(el.value, el.selectionStart, el.selectionEnd);
    setValue(edit.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(edit.start, edit.end);
    });
  }

  async function addPicture(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setNote(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadPageImageAction(fd);
    setBusy(false);
    if (!res.ok) return setNote(res.message);
    const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/[\[\]()]/g, "");
    apply((text, start) => insertBlock(text, start, `![${alt}](${res.url})`));
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5" role="toolbar" aria-label={`${label} formatting`}>
        <button type="button" className={button} onClick={() => apply((t, s, e) => prefixLines(t, s, e, "## "))} aria-label="Heading">H</button>
        <button type="button" className={`${button} font-bold`} onClick={() => apply((t, s, e) => wrapSelection(t, s, e, "**", "**", "bold text"))} aria-label="Bold">B</button>
        <button type="button" className={`${button} italic`} onClick={() => apply((t, s, e) => wrapSelection(t, s, e, "*", "*", "italic text"))} aria-label="Italic">I</button>
        <button type="button" className={button} onClick={() => apply(linkSelection)} aria-label="Link">Link</button>
        <button type="button" className={button} onClick={() => apply((t, s, e) => prefixLines(t, s, e, "- "))} aria-label="Bulleted list">• List</button>
        <button type="button" className={button} onClick={() => apply((t, s, e) => prefixLines(t, s, e, "1. "))} aria-label="Numbered list">1. List</button>
        <button type="button" className={button} onClick={() => apply((t, s, e) => prefixLines(t, s, e, "> "))} aria-label="Quote">&ldquo; Quote</button>
        <label className={`${button} inline-flex cursor-pointer items-center ${busy ? "opacity-60" : ""}`}>
          {busy ? "Uploading…" : "Picture"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={(e) => { void addPicture(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <span className="ml-auto flex gap-1" role="group" aria-label="View">
          <button type="button" className={`${button} ${!preview ? "bg-stone-200" : ""}`} aria-pressed={!preview} onClick={() => setPreview(false)}>Write</button>
          <button type="button" className={`${button} ${preview ? "bg-stone-200" : ""}`} aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
        </span>
      </div>
      {note && <p role="alert" className="mb-2 text-sm text-red-700">{note}</p>}
      <textarea
        id={id}
        ref={area}
        name={name}
        required={required}
        minLength={10}
        maxLength={20000}
        rows={14}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={label}
        aria-invalid={invalid}
        hidden={preview}
        className={`${textarea} p-3 font-mono text-[13px]`}
      />
      {preview && (
        <div className="luxe min-h-40 rounded-lg border border-stone-300 p-5" aria-live="polite" aria-label="Preview of the page">
          {value.trim() ? <RichText source={value} /> : <p className="text-muted">Nothing to preview yet.</p>}
        </div>
      )}
      <p className="mt-1 text-xs text-muted">Use the buttons or type Markdown: # heading, **bold**, *italic*, [text](https://link), - list. Raw HTML is shown as plain text.</p>
    </div>
  );
}
