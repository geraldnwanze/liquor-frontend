import test from "node:test";
import assert from "node:assert/strict";
import { orderStatusLabel, orderStatusTone } from "./status.ts";

test("every order status has a human label", () => {
  assert.equal(orderStatusLabel("pending_payment"), "Awaiting payment");
  assert.equal(orderStatusLabel("paid"), "Paid");
  assert.equal(orderStatusLabel("cancelled"), "Cancelled");
  assert.equal(orderStatusLabel("expired"), "Expired");
});

test("tones are distinct for paid and pending", () => {
  assert.notEqual(orderStatusTone("paid"), orderStatusTone("pending_payment"));
});
