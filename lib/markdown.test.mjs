import assert from "node:assert/strict";
import test from "node:test";
import { parseInline, parseMarkdown, safeHref } from "./markdown.ts";

const text = (v) => ({ t: "text", v });

test("headings, paragraphs and horizontal rules", () => {
  const blocks = parseMarkdown("# Title\n\nFirst line\nsecond line\n\n### Small\n---");
  assert.deepEqual(blocks[0], { t: "h", level: 1, c: [text("Title")] });
  assert.deepEqual(blocks[1], { t: "p", c: [text("First line"), { t: "br" }, text("second line")] });
  assert.deepEqual(blocks[2], { t: "h", level: 3, c: [text("Small")] });
  assert.deepEqual(blocks[3], { t: "hr" });
});

test("lists, ordered lists and quotes stay separate blocks", () => {
  const blocks = parseMarkdown("- one\n- two\n1. first\n2. second\n> wise words");
  assert.deepEqual(blocks.map((b) => b.t), ["ul", "ol", "quote"]);
  assert.equal(blocks[0].items.length, 2);
  assert.deepEqual(blocks[1].items[1], [text("second")]);
});

test("inline emphasis, code and a link inside bold", () => {
  assert.deepEqual(parseInline("a **bold** and *italic* b"), [text("a "), { t: "b", c: [text("bold")] }, text(" and "), { t: "i", c: [text("italic")] }, text(" b")]);
  assert.deepEqual(parseInline("use `npm run dev`"), [text("use "), { t: "code", v: "npm run dev" }]);
  assert.deepEqual(parseInline("**[read more](/info/faq)**"), [{ t: "b", c: [{ t: "a", href: "/info/faq", c: [text("read more")] }] }]);
  assert.deepEqual(parseInline("snake_case_word"), [text("snake_case_word")]);
});

test("only safe links are followed, unsafe ones keep their words", () => {
  assert.equal(safeHref("https://example.com/a?b=1"), "https://example.com/a?b=1");
  assert.equal(safeHref("/info/delivery"), "/info/delivery");
  assert.equal(safeHref("mailto:hi@example.com"), "mailto:hi@example.com");
  for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,x", "//evil.test", "http://insecure.test", "vbscript:x", " ", ""]) assert.equal(safeHref(bad), null, bad);
  // The link text survives as plain words (a stray ")" from the nested parentheses is harmless text).
  assert.deepEqual(parseInline("[click](javascript:alert(1))").map((n) => n.t), ["text", "text"]);
  assert.equal(parseInline("[click](javascript:alert(1))").some((n) => n.t === "a"), false);
  assert.deepEqual(parseInline("[our page](/info/faq)"), [{ t: "a", href: "/info/faq", c: [text("our page")] }]);
});

test("raw HTML is only ever text", () => {
  const blocks = parseMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>');
  assert.deepEqual(blocks, [{ t: "p", c: [text("<script>alert(1)</script>")] }, { t: "p", c: [text("<img src=x onerror=alert(1)>")] }]);
});

test("pictures need https", () => {
  assert.deepEqual(parseMarkdown("![A bottle](https://res.cloudinary.com/x/y.webp)"), [{ t: "img", alt: "A bottle", src: "https://res.cloudinary.com/x/y.webp" }]);
  assert.deepEqual(parseMarkdown("![x](http://insecure.test/a.png)")[0].t, "p");
  assert.deepEqual(parseMarkdown("![x](javascript:alert(1))")[0].t, "p");
});

test("empty input and windows line endings", () => {
  assert.deepEqual(parseMarkdown(""), []);
  assert.deepEqual(parseMarkdown("a\r\n\r\nb").map((b) => b.t), ["p", "p"]);
});
