/**
 * A small, safe Markdown subset for staff-written pages. It never produces HTML: it returns plain data that React
 * renders as elements, so nothing a writer types can inject markup or script. Supported: # to ### headings, paragraphs,
 * - and 1. lists, > quotes, ---, **bold**, *italic*, `code`, [links](https://…), and ![pictures](https://…).
 * Anything else (including raw HTML) is shown as text.
 */
export type Inline =
  | { t: "text"; v: string }
  | { t: "b" | "i"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "a"; href: string; c: Inline[] }
  | { t: "br" };

export type Block =
  | { t: "h"; level: 1 | 2 | 3; c: Inline[] }
  | { t: "p"; c: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }
  | { t: "quote"; c: Inline[] }
  | { t: "hr" }
  | { t: "img"; alt: string; src: string };

/** Only https links, site-relative paths, mail and phone links are followed; anything else (javascript:, data:, //host) is dropped. */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^https:\/\/[^\s]+$/i.test(href)) return href;
  if (/^\/(?!\/)[^\s]*$/.test(href)) return href;
  if (/^(mailto|tel):[^\s]+$/i.test(href)) return href;
  return null;
}

const INLINE = /\*\*([^*]+?)\*\*|\*([^*\s][^*]*?)\*|(?<![A-Za-z0-9])_([^_\s][^_]*?)_(?![A-Za-z0-9])|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\n/g;

export function parseInline(text: string, depth = 0): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ t: "text", v: text.slice(last, at) });
    last = at + m[0].length;
    if (m[0] === "\n") out.push({ t: "br" });
    else if (m[1] !== undefined) out.push({ t: "b", c: depth < 3 ? parseInline(m[1], depth + 1) : [{ t: "text", v: m[1] }] });
    else if (m[2] !== undefined || m[3] !== undefined) out.push({ t: "i", c: depth < 3 ? parseInline((m[2] ?? m[3]) as string, depth + 1) : [{ t: "text", v: (m[2] ?? m[3]) as string }] });
    else if (m[4] !== undefined) out.push({ t: "code", v: m[4] });
    else {
      const href = safeHref(m[6]);
      const inner = depth < 3 ? parseInline(m[5], depth + 1) : [{ t: "text" as const, v: m[5] }];
      // An unsafe link keeps its words but loses the link.
      if (href) out.push({ t: "a", href, c: inner });
      else out.push(...inner);
    }
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

const IMAGE = /^!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)$/;

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { t: "ul" | "ol"; items: Inline[][] } | null = null;
  let quote: string[] = [];

  const flush = () => {
    if (para.length) blocks.push({ t: "p", c: parseInline(para.join("\n")) });
    if (list) blocks.push(list);
    if (quote.length) blocks.push({ t: "quote", c: parseInline(quote.join("\n")) });
    para = [];
    list = null;
    quote = [];
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    let m: RegExpMatchArray | null;
    if (line === "") flush();
    else if ((m = line.match(/^(#{1,3})\s+(.+)$/))) {
      flush();
      blocks.push({ t: "h", level: m[1].length as 1 | 2 | 3, c: parseInline(m[2]) });
    } else if (/^(-{3,}|\*{3,})$/.test(line)) {
      flush();
      blocks.push({ t: "hr" });
    } else if ((m = line.match(IMAGE))) {
      flush();
      blocks.push({ t: "img", alt: m[1], src: m[2] });
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      if (para.length || list) flush();
      quote.push(m[1]);
    } else if ((m = line.match(/^([-*]|\d+\.)\s+(.+)$/))) {
      const kind = m[1] === "-" || m[1] === "*" ? "ul" : "ol";
      if (para.length || quote.length || (list && list.t !== kind)) flush();
      list ??= { t: kind, items: [] };
      list.items.push(parseInline(m[2]));
    } else {
      if (list || quote.length) flush();
      para.push(line);
    }
  }
  flush();
  return blocks;
}
