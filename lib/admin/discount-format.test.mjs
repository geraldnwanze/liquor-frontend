import test from "node:test";
import assert from "node:assert/strict";
const naira = (k) => `₦${(k / 100).toLocaleString("en-NG")}`;
import { describeDiscount, isoToLagosInput, lagosInputToIso } from "./discount-format.ts";

test("a discount is described in one readable line", () => {
  assert.equal(describeDiscount({ type: "percentage", percent: 10, amount_kobo: null, max_discount_kobo: 500000, min_order_kobo: 1000000 }, naira), "10% off, up to ₦5,000, from ₦10,000");
  assert.equal(describeDiscount({ type: "fixed", percent: null, amount_kobo: 100000, max_discount_kobo: null, min_order_kobo: null }, naira), "₦1,000 off");
  assert.equal(describeDiscount({ type: "free_delivery", percent: null, amount_kobo: null, max_discount_kobo: null, min_order_kobo: null }, naira), "Free delivery");
});

test("dates are typed and shown in Nigerian time, whatever the server's time zone is", () => {
  assert.equal(lagosInputToIso("2026-12-25T09:30"), "2026-12-25T09:30:00+01:00");
  assert.equal(lagosInputToIso(""), null);
  assert.equal(lagosInputToIso("tomorrow"), null);
  // 08:30 UTC is 09:30 in Lagos
  assert.equal(isoToLagosInput("2026-12-25T08:30:00Z"), "2026-12-25T09:30");
  assert.equal(isoToLagosInput(null), "");
  // round trip
  assert.equal(isoToLagosInput(lagosInputToIso("2026-01-02T23:45")), "2026-01-02T23:45");
});
