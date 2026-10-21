import test from "node:test";
import assert from "node:assert/strict";
import { addDays, daysBetween, defaultGroup, lagosToday, parseReportRange, periodLabel, presets } from "./report-range.ts";
import { toCsv } from "./csv.ts";
import { formatNairaCompact } from "../money.ts";

test("today is the date in Nigeria, not UTC", () => {
  assert.equal(lagosToday(new Date("2026-05-20T23:30:00Z")), "2026-05-21"); // 00:30 in Lagos
  assert.equal(lagosToday(new Date("2026-05-20T22:30:00Z")), "2026-05-20");
});

test("date arithmetic is in whole days", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(daysBetween("2026-03-01", "2026-03-31"), 30);
});

test("the range is read from the URL and anything unusable becomes the last 30 days", () => {
  const today = "2026-05-21";
  assert.deepEqual(parseReportRange({ from: "2026-05-01", to: "2026-05-10", group: "week" }, today), { from: "2026-05-01", to: "2026-05-10", group: "week" });
  const fallback = { from: "2026-04-22", to: "2026-05-21", group: "day" };
  assert.deepEqual(parseReportRange({}, today), fallback);
  assert.deepEqual(parseReportRange({ from: "nope", to: "2026-05-10" }, today), fallback);
  assert.deepEqual(parseReportRange({ from: "2026-05-10", to: "2026-05-01" }, today), fallback); // end before start
  assert.deepEqual(parseReportRange({ from: "2026-02-30", to: "2026-03-05" }, today), fallback); // not a real date
  assert.deepEqual(parseReportRange({ from: "2024-01-01", to: "2026-05-01" }, today), fallback); // over a year
  assert.equal(parseReportRange({ from: "2026-05-01", to: "2026-05-10", group: "hour" }, today).group, "day");
});

test("long ranges default to weeks or months", () => {
  assert.equal(defaultGroup("2026-05-01", "2026-05-30"), "day");
  assert.equal(defaultGroup("2026-01-01", "2026-04-30"), "week");
  assert.equal(defaultGroup("2025-06-01", "2026-05-30"), "month");
});

test("quick ranges are computed from today in Nigeria", () => {
  const p = Object.fromEntries(presets("2026-05-21").map((x) => [x.label, x]));
  assert.deepEqual(p["Last 7 days"], { label: "Last 7 days", from: "2026-05-15", to: "2026-05-21" });
  assert.deepEqual(p["This month"], { label: "This month", from: "2026-05-01", to: "2026-05-21" });
  assert.deepEqual(p["Last month"], { label: "Last month", from: "2026-04-01", to: "2026-04-30" });
  assert.deepEqual(presets("2026-01-05").find((x) => x.label === "Last month"), { label: "Last month", from: "2025-12-01", to: "2025-12-31" });
});

test("period labels", () => {
  assert.equal(periodLabel("2026-03-05", "day"), "5 Mar");
  assert.equal(periodLabel("2026-03-02", "week"), "Wk 2 Mar");
  assert.equal(periodLabel("2026-03-01", "month"), "Mar 2026");
});

test("CSV escapes quotes, commas and line breaks, and defuses spreadsheet formulas", () => {
  assert.equal(toCsv([["a", 'b "quoted"', "c,d", "e\nf"], [1, null, undefined, -5]]), 'a,"b ""quoted""","c,d","e\nf"\r\n1,,,-5\r\n');
  assert.equal(toCsv([["=HYPERLINK(\"http://evil\")", "+1", "-2", "@SUM(A1)", "plain"]]), "\"'=HYPERLINK(\"\"http://evil\"\")\",'+1,'-2,'@SUM(A1),plain\r\n");
  assert.equal(toCsv([[-5, "-5"]]), "-5,'-5\r\n"); // a real number stays a number, a text "-5" is guarded
});

test("compact money labels for chart axes", () => {
  assert.equal(formatNairaCompact(0), "₦0");
  assert.equal(formatNairaCompact(90_000), "₦900");
  assert.equal(formatNairaCompact(1_550_000), "₦15.5K");
  assert.equal(formatNairaCompact(85_000_000), "₦850K");
  assert.equal(formatNairaCompact(120_000_000), "₦1.2M");
  assert.equal(formatNairaCompact(100_000_000), "₦1M");
});
