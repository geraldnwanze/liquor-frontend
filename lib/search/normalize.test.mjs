import assert from "node:assert/strict";
import test from "node:test";
import { normalizeQuery } from "./normalize.ts";

test("trims, collapses spaces and caps the length", () => {
  assert.equal(normalizeQuery("  london   dry  gin "), "london dry gin");
  assert.equal(normalizeQuery("x".repeat(300))?.length, 100);
});

test("searches from the first character, but never an empty box", () => {
  assert.equal(normalizeQuery(" a "), "a");
  assert.equal(normalizeQuery(""), null);
  assert.equal(normalizeQuery("   "), null);
  assert.equal(normalizeQuery(null), null);
  assert.equal(normalizeQuery(undefined), null);
});
