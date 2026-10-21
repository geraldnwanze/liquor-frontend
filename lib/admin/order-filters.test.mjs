import test from "node:test";
import assert from "node:assert/strict";
import { parseAdminOrderFilters, filterParams } from "./order-filters.ts";
import { can, canAny } from "../auth/permissions.ts";

test("valid filters are read from the URL", () => {
  const f = parseAdminOrderFilters({ q: " ada ", status: "paid", fulfilment_status: "processing", from: "2026-10-01", to: "2026-10-31", page: "3" });
  assert.deepEqual(f, { q: "ada", status: "paid", payment_status: "", fulfilment_status: "processing", from: "2026-10-01", to: "2026-10-31", page: 3 });
  assert.deepEqual(filterParams(f), { q: "ada", status: "paid", fulfilment_status: "processing", from: "2026-10-01", to: "2026-10-31" });
});

test("unexpected values are dropped, not forwarded", () => {
  const f = parseAdminOrderFilters({ status: "paid; drop table", payment_status: "nope", fulfilment_status: ["delivered", "x"], from: "yesterday", to: "2026-13-45", page: "-2", q: "x".repeat(300) });
  assert.equal(f.status, "");
  assert.equal(f.payment_status, "");
  assert.equal(f.fulfilment_status, "delivered");
  assert.equal(f.from, "");
  assert.equal(f.to, "");
  assert.equal(f.page, 1);
  assert.equal(f.q.length, 100);
});

test("permission helper treats * as everything and is false for missing data", () => {
  assert.equal(can({ permissions: ["orders.view"] }, "orders.view"), true);
  assert.equal(can({ permissions: ["orders.view"] }, "orders.manage"), false);
  assert.equal(can({ permissions: ["*"] }, "anything.at.all"), true);
  assert.equal(can(null, "orders.view"), false);
  assert.equal(can({}, "orders.view"), false);
  assert.equal(canAny({ permissions: ["orders.manage"] }, "orders.view", "orders.manage"), true);
});

import { parseAdminProductFilters, productFilterParams } from "./product-filters.ts";

test("product filters keep valid values and drop the rest", () => {
  const ok = parseAdminProductFilters({ q: " rum ", status: "draft", category_id: "0199f6a2-7c1e-7b3a-9d4f-5e6a7b8c9d0e", page: "2" });
  assert.deepEqual(ok, { q: "rum", status: "draft", category_id: "0199f6a2-7c1e-7b3a-9d4f-5e6a7b8c9d0e", page: 2 });
  assert.deepEqual(productFilterParams(ok), { q: "rum", status: "draft", category_id: "0199f6a2-7c1e-7b3a-9d4f-5e6a7b8c9d0e" });
  const bad = parseAdminProductFilters({ status: "deleted", category_id: "1 or 1=1", page: "0" });
  assert.deepEqual(bad, { q: "", status: "", category_id: "", page: 1 });
});
