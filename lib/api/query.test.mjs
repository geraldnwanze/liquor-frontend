import test from "node:test";
import assert from "node:assert/strict";
import { applyQuery } from "./query.ts";

test("booleans are sent as 1/0 (Laravel's boolean rule rejects 'true')", () => {
  const url = applyQuery(new URL("http://api.test/products"), { in_stock: true, other: false });
  assert.equal(url.search, "?in_stock=1&other=0");
});

test("undefined and empty values are omitted; numbers are stringified", () => {
  const url = applyQuery(new URL("http://api.test/products"), { q: "", sort: undefined, page: 2, min_price: 0 });
  assert.equal(url.search, "?page=2&min_price=0");
});
