import assert from "node:assert/strict";
import test from "node:test";
import { insertBlock, linkSelection, prefixLines, wrapSelection } from "./markdown-edit.ts";

test("bold wraps the selection, a placeholder when empty, and unwraps when pressed again", () => {
  assert.deepEqual(wrapSelection("say hello now", 4, 9, "**", "**", "bold"), { text: "say **hello** now", start: 6, end: 11 });
  const empty = wrapSelection("", 0, 0, "**", "**", "bold text");
  assert.deepEqual(empty, { text: "**bold text**", start: 2, end: 11 });
  assert.deepEqual(wrapSelection("say **hello** now", 6, 11, "**", "**", "bold"), { text: "say hello now", start: 4, end: 9 });
});

test("a heading prefix goes on each touched line and comes off when applied again", () => {
  const once = prefixLines("one\ntwo\nthree", 0, 5, "## ");
  assert.equal(once.text, "## one\n## two\nthree");
  assert.equal(prefixLines(once.text, 0, 13, "## ").text, "one\ntwo\nthree");
});

test("switching list style replaces the old prefix instead of stacking", () => {
  assert.equal(prefixLines("- item", 0, 6, "1. ").text, "1. item");
  assert.equal(prefixLines("# title", 0, 7, "- ").text, "- title");
});

test("pictures go on their own line with blank lines around", () => {
  assert.equal(insertBlock("intro", 5, "![a](https://x.test/a.png)").text, "intro\n\n![a](https://x.test/a.png)");
  assert.equal(insertBlock("", 0, "![a](https://x.test/a.png)").text, "![a](https://x.test/a.png)");
  assert.equal(insertBlock("ab", 1, "IMG").text, "a\n\nIMG\n\nb");
});

test("a link keeps the selected words and selects the address to replace", () => {
  const e = linkSelection("see our FAQ today", 8, 11);
  assert.equal(e.text, "see our [FAQ](https://) today");
  assert.equal(e.text.slice(e.start, e.end), "https://");
});
