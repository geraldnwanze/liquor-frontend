import test from "node:test";
import assert from "node:assert/strict";
import { parseListingParams } from "./listing-params.ts";

test("empty URL gives defaults", () => {
  const r = parseListingParams({});
  assert.deepEqual(r.query, { per_page: 24 });
  assert.deepEqual(r.linkParams, {});
  assert.equal(r.form.sort, "newest");
});

test("valid filters are parsed and kept for pagination links", () => {
  const r = parseListingParams({ q: "  malt ", sort: "price_asc", min_price: "5000", max_price: "40000", in_stock: "1", page: "3" });
  assert.deepEqual(r.query, { per_page: 24, q: "malt", sort: "price_asc", min_price: 5000, max_price: 40000, in_stock: true, page: 3 });
  assert.deepEqual(r.linkParams, { q: "malt", sort: "price_asc", min_price: "5000", max_price: "40000", in_stock: "1" });
});

test("malformed or hostile values are dropped, never forwarded", () => {
  const r = parseListingParams({ sort: "price; drop table", min_price: "-5", max_price: "1e9", page: "0", in_stock: "yes", q: "x".repeat(300) });
  assert.equal(r.query.sort, undefined);
  assert.equal(r.query.min_price, undefined);
  assert.equal(r.query.max_price, undefined);
  assert.equal(r.query.page, undefined);
  assert.equal(r.query.in_stock, undefined);
  assert.equal(r.query.q?.length, 100);
});

test("array params use the first value; page 1 is omitted", () => {
  const r = parseListingParams({ q: ["gin", "rum"], page: "1" });
  assert.equal(r.query.q, "gin");
  assert.equal(r.query.page, undefined);
});
