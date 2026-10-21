import test from "node:test";
import assert from "node:assert/strict";
import { safeGatewayUrl } from "./gateway-url.ts";
import { isFinalState, shouldKeepPolling, pollDelayMs, isPaymentReference } from "./polling.ts";
import { toPaymentResult } from "../api/result.ts";

const SITE = "https://shop.example.com";

test("only https pages or this site are valid payment destinations", () => {
  assert.equal(safeGatewayUrl("https://checkout.paystack.com/abc", SITE), "https://checkout.paystack.com/abc");
  assert.equal(safeGatewayUrl("https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-1", SITE), "https://checkout.flutterwave.com/v3/hosted/pay/flwlnk-1");
  assert.equal(safeGatewayUrl("https://shop.example.com/dev/pay/LQPX", SITE), "https://shop.example.com/dev/pay/LQPX");
  assert.equal(safeGatewayUrl("/dev/pay/LQPX", SITE), "https://shop.example.com/dev/pay/LQPX");
  for (const bad of ["javascript:alert(1)", "data:text/html,<script>1</script>", "http://evil.test/pay", "ftp://x.test", "", undefined, null]) {
    assert.equal(safeGatewayUrl(bad, SITE), null, String(bad));
  }
  // A scheme-relative URL inherits this site's https, so it is a normal https destination.
  assert.equal(safeGatewayUrl("//checkout.example.test/x", SITE), "https://checkout.example.test/x");
});

test("polling stops on a final state and on failure, and gives up after the budget", () => {
  assert.equal(isFinalState("succeeded"), true);
  assert.equal(isFinalState("review"), true);
  assert.equal(isFinalState("pending"), false);
  assert.equal(shouldKeepPolling("pending", 0), true);
  assert.equal(shouldKeepPolling("pending", 89_000), true);
  assert.equal(shouldKeepPolling("pending", 90_000), false);
  for (const s of ["succeeded", "review", "failed", "abandoned"]) assert.equal(shouldKeepPolling(s, 0), false, s);
});

test("poll delay backs off but never exceeds 8 seconds", () => {
  assert.equal(pollDelayMs(0), 2_500);
  assert.ok(pollDelayMs(3) > pollDelayMs(0));
  assert.equal(pollDelayMs(100), 8_000);
});

test("payment references have a strict shape", () => {
  assert.equal(isPaymentReference("LQPABCDEFGHJKMNP234"), true);
  assert.equal(isPaymentReference("LQP" + "A".repeat(16)), true);
  for (const bad of ["", "lqpabcdefghjkmnp234", "LQP123", "LQP" + "A".repeat(17), "../etc/passwd", "LQP" + "A".repeat(16) + "\n"]) assert.equal(isPaymentReference(bad), false, bad);
});

test("API payment responses map to typed results", () => {
  const ok = toPaymentResult({ status: 200, json: { data: { reference: "LQPX", state: "succeeded" } } });
  assert.equal(ok.ok && ok.payment.state, "succeeded");
  const err = toPaymentResult({ status: 409, json: { message: "This order has already been paid.", code: "order_not_payable" } });
  assert.equal(err.ok, false);
  assert.equal(!err.ok && err.code, "order_not_payable");
});
