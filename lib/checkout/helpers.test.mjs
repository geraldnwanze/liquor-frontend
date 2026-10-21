import test from "node:test";
import assert from "node:assert/strict";
import { formatNaira } from "../money.ts";
import { normalizeNigerianPhone } from "./phone.ts";
import { coverage, citiesFor, statesFor, findZone } from "./coverage.ts";
import { checkoutBlocker, issueMessage } from "../cart/messages.ts";
import { toCartResult, toOrderResult, toError, networkError } from "../api/result.ts";
import { isValidAttemptKey } from "./attempt-key.ts";

const zones = [
  { name: "Lagos", state: "Lagos", city: null },
  { name: "Ibadan", state: "Oyo", city: "Ibadan" },
  { name: "Ikeja", state: "Lagos", city: "Ikeja" },
];

test("formatNaira matches the server format", () => {
  assert.equal(formatNaira(0), "₦0");
  assert.equal(formatNaira(2_500_000), "₦25,000");
  assert.equal(formatNaira(1_234_550), "₦12,345.50");
  assert.equal(formatNaira(105), "₦1.05");
});

test("phone normalisation mirrors the backend", () => {
  for (const ok of ["08031234567", "8031234567", "2348031234567", "+234 803 123 4567", "0803-123-4567"]) assert.equal(normalizeNigerianPhone(ok), "+2348031234567", ok);
  for (const bad of ["12345", "0603123456", "+44 7911 123456", ""]) assert.equal(normalizeNigerianPhone(bad), null, bad);
});

test("delivery coverage: city zone, state-wide zone, unknown and not covered", () => {
  assert.equal(coverage(zones, "", "Ikeja"), "unknown");
  assert.equal(coverage(zones, "Lagos", "Ikeja"), "covered");
  assert.equal(coverage(zones, "lagos", "Some Other Town"), "covered"); // state-wide zone
  assert.equal(coverage(zones, "Oyo", "Ibadan"), "covered");
  assert.equal(coverage(zones, "Oyo", "Ogbomosho"), "not_covered"); // only Ibadan is served
  assert.equal(coverage(zones, "Kano", "Kano"), "not_covered");
  assert.equal(findZone(zones, "Lagos", "ikeja").name, "Ikeja"); // city zone wins over state-wide
  assert.deepEqual(statesFor(zones), ["Lagos", "Oyo"]);
  assert.deepEqual(citiesFor(zones, "Lagos"), ["Ikeja"]);
});

test("checkout is blocked offline, when empty, or with unresolved issues", () => {
  const cart = { items: [{ id: "0199f6a2-7c1e-7b3a-9d4f-5e6a7b8c9d0e" }], has_issues: false };
  assert.match(checkoutBlocker(cart, false), /offline/i);
  assert.match(checkoutBlocker(null, true), /empty/i);
  assert.match(checkoutBlocker({ items: [], has_issues: false }, true), /empty/i);
  assert.match(checkoutBlocker({ ...cart, has_issues: true }, true), /attention/i);
  assert.equal(checkoutBlocker(cart, true), null);
  assert.match(issueMessage("out_of_stock"), /out of stock/i);
});

test("API responses map to typed results", () => {
  assert.equal(toCartResult({ status: 201, json: { data: { items: [] } } }).ok, true);
  const order = toOrderResult({ status: 200, json: { data: { reference: "LQ1" } } });
  assert.equal(order.ok && order.replayed, true);
  assert.equal(toOrderResult({ status: 201, json: { data: { reference: "LQ1" } } }).replayed, false);

  const stock = toError({ status: 422, json: { message: "Only 3 left in stock.", code: "insufficient_stock", details: { available: 3 } } });
  assert.deepEqual([stock.code, stock.message, stock.details], ["insufficient_stock", "Only 3 left in stock.", { available: 3 }]);

  const validation = toError({ status: 422, json: { message: "The phone field is invalid.", errors: { phone: ["Enter a valid Nigerian mobile number"] } } });
  assert.equal(validation.code, "validation");
  assert.deepEqual(validation.fieldErrors, { phone: ["Enter a valid Nigerian mobile number"] });

  assert.equal(toError({ status: 429, json: null }).code, "rate_limited");
  assert.equal(toError({ status: 500, json: "<html>" }).code, "error");
  assert.equal(networkError().code, "network");
});

test("attempt keys satisfy the backend format", () => {
  assert.equal(isValidAttemptKey(crypto.randomUUID()), true);
  assert.equal(isValidAttemptKey("short"), false);
  assert.equal(isValidAttemptKey("has spaces in it 1234567890"), false);
});
