import assert from "node:assert/strict";
import test from "node:test";
import { isUuid } from "./ids.ts";

test("accepts real UUIDs of any version", () => {
  assert.equal(isUuid("0199f6a2-7c1e-7b3a-9d4f-5e6a7b8c9d0e"), true);
  assert.equal(isUuid("3F2504E0-4F89-41D3-9A0C-0305E82C3301"), true);
});

test("rejects numbers, junk, path tricks and non-strings", () => {
  for (const v of [1, "1", "", "abc", "../admin", "0199f6a2-7c1e-7b3a-9d4f-5e6a7b8c9d0", "0199f6a2-7c1e-7b3a-9d4f-5e6a7b8c9d0ez", null, undefined, {}]) {
    assert.equal(isUuid(v), false, String(v));
  }
});
