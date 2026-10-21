/** Text edits behind the page editor's toolbar. Pure functions: they take the text and the selection, and return both. */
export interface Edit {
  text: string;
  start: number;
  end: number;
}

/** Wraps the selection (or a placeholder) in markers, e.g. **bold**. Pressing it again on a wrapped selection unwraps it. */
export function wrapSelection(text: string, start: number, end: number, before: string, after: string, placeholder: string): Edit {
  const selected = text.slice(start, end);
  const around = text.slice(Math.max(0, start - before.length), start) === before && text.slice(end, end + after.length) === after;
  if (around) {
    return { text: text.slice(0, start - before.length) + selected + text.slice(end + after.length), start: start - before.length, end: end - before.length };
  }
  const inner = selected || placeholder;
  const next = text.slice(0, start) + before + inner + after + text.slice(end);
  return { text: next, start: start + before.length, end: start + before.length + inner.length };
}

/** Puts a prefix (like "## " or "- ") at the start of every line the selection touches; applying it again removes it. */
export function prefixLines(text: string, start: number, end: number, prefix: string): Edit {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const nl = text.indexOf("\n", end);
  const lineEnd = nl === -1 ? text.length : nl;
  const lines = text.slice(lineStart, lineEnd).split("\n");
  const allHave = lines.every((l) => l.startsWith(prefix));
  const strip = (l: string) => l.replace(/^(#{1,3}\s+|[-*]\s+|\d+\.\s+|>\s?)/, "");
  const changed = lines.map((l) => (allHave ? l.slice(prefix.length) : prefix + strip(l))).join("\n");
  return { text: text.slice(0, lineStart) + changed + text.slice(lineEnd), start: lineStart, end: lineStart + changed.length };
}

/** Inserts text on its own line at the cursor (used for pictures). */
export function insertBlock(text: string, at: number, block: string): Edit {
  const before = text.slice(0, at);
  const after = text.slice(at);
  const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const tail = after === "" || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const next = before + lead + block + tail + after;
  const pos = (before + lead + block).length;
  return { text: next, start: pos, end: pos };
}

/** A link around the selection: the words stay, the address is a placeholder the writer then replaces. */
export function linkSelection(text: string, start: number, end: number): Edit {
  const words = text.slice(start, end) || "link text";
  const url = "https://";
  const next = text.slice(0, start) + `[${words}](${url})` + text.slice(end);
  const urlStart = start + words.length + 3;
  return { text: next, start: urlStart, end: urlStart + url.length };
}
