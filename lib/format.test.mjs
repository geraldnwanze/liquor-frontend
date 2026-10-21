import test from "node:test";
import assert from "node:assert/strict";
import { nairaToKobo, formatDateTime } from "./format.ts";

test("naira typed by staff becomes exact kobo", () => {
  assert.equal(nairaToKobo("1500"), 150000);
  assert.equal(nairaToKobo("1,500"), 150000);
  assert.equal(nairaToKobo("₦ 1,500.50"), 150050);
  assert.equal(nairaToKobo("0.1"), 10);
  assert.equal(nairaToKobo("19.99"), 1999);
  assert.equal(nairaToKobo("100.5"), 10050);
});

test("anything that is not a plain amount is refused", () => {
  for (const bad of ["", "abc", "-5", "1.234", "1e5", "12.", ".5", "1,2,3.4.5", "9999999999", "NaN"]) assert.equal(nairaToKobo(bad), null, bad);
});

test("times are shown in Nigerian time", () => {
  assert.match(formatDateTime("2026-10-16T17:30:00Z"), /18:30/); // UTC+1
  assert.equal(formatDateTime(null), "");
});

import { koboToNairaInput } from "./format.ts";

test("kobo shown back in an edit box round-trips with nairaToKobo", () => {
  assert.equal(koboToNairaInput(1500000), "15000");
  assert.equal(koboToNairaInput(1500050), "15000.50");
  assert.equal(koboToNairaInput(5), "0.05");
  assert.equal(koboToNairaInput(null), "");
  for (const k of [1, 99, 100, 123456, 1500000, 1500050]) assert.equal(nairaToKobo(koboToNairaInput(k)), k);
});
