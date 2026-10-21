import test from "node:test";
import assert from "node:assert/strict";
import { detectPlatform, installMode, installGuide, shouldShowBanner, snoozeDays } from "./install-policy.ts";
import { isUpdateDeferred } from "./update-policy.ts";

const UA = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0 Mobile/15E148 Safari/604.1",
  ipadDesktopUa: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  androidFacebook: "Mozilla/5.0 (Linux; Android 13; TECNO) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0]",
  desktopEdge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  desktopFirefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
};

test("platform detection", () => {
  assert.deepEqual(detectPlatform(UA.iphoneSafari), { os: "ios", browser: "safari", inApp: false });
  assert.deepEqual(detectPlatform(UA.iphoneChrome), { os: "ios", browser: "chrome", inApp: false });
  assert.equal(detectPlatform(UA.ipadDesktopUa, 5).os, "ios"); // iPadOS masquerading as a Mac
  assert.equal(detectPlatform(UA.macSafari, 0).os, "desktop");
  assert.deepEqual(detectPlatform(UA.androidChrome), { os: "android", browser: "chrome", inApp: false });
  assert.equal(detectPlatform(UA.androidFacebook).inApp, true);
  assert.deepEqual(detectPlatform(UA.desktopEdge), { os: "desktop", browser: "edge", inApp: false });
  assert.equal(detectPlatform(UA.desktopFirefox).browser, "firefox");
});

test("install mode depends on what the browser can actually do", () => {
  assert.equal(installMode(detectPlatform(UA.androidChrome), true), "native");
  assert.equal(installMode(detectPlatform(UA.iphoneSafari), false), "manual-ios");
  assert.equal(installMode(detectPlatform(UA.androidFacebook), false), "open-in-browser");
  assert.equal(installMode(detectPlatform(UA.desktopFirefox), false), "unsupported");
  assert.equal(installMode(detectPlatform(UA.androidChrome), false), "manual-menu");
  assert.equal(installMode(detectPlatform(UA.desktopEdge), false), "manual-menu");
});

test("guides give platform-appropriate steps", () => {
  const ios = installGuide(detectPlatform(UA.iphoneSafari), "manual-ios");
  assert.match(ios.steps.join(" "), /Add to Home Screen/);
  assert.equal(ios.note, undefined);
  assert.ok(installGuide(detectPlatform(UA.iphoneChrome), "manual-ios").note);
  assert.match(installGuide(detectPlatform(UA.macSafari), "manual-menu").steps.join(" "), /Add to Dock/);
  assert.match(installGuide(detectPlatform(UA.androidFacebook), "open-in-browser").title, /browser/i);
});

test("snooze grows each time the customer declines", () => {
  assert.deepEqual([1, 2, 3, 9].map(snoozeDays), [14, 60, 180, 180]);
});

test("banner shows only when actionable, after browsing, outside any snooze", () => {
  const base = { standalone: false, installed: false, mode: "native", pageViews: 3, dismissedUntil: null, now: 1000 };
  assert.equal(shouldShowBanner(base), true);
  assert.equal(shouldShowBanner({ ...base, mode: "manual-ios" }), true);
  assert.equal(shouldShowBanner({ ...base, standalone: true }), false);
  assert.equal(shouldShowBanner({ ...base, installed: true }), false);
  assert.equal(shouldShowBanner({ ...base, pageViews: 1 }), false);
  assert.equal(shouldShowBanner({ ...base, dismissedUntil: 5000 }), false);
  assert.equal(shouldShowBanner({ ...base, dismissedUntil: 500 }), true);
  for (const mode of ["unsupported", "open-in-browser", "manual-menu"]) assert.equal(shouldShowBanner({ ...base, mode }), false, mode);
});

test("update prompts are deferred on checkout and payment routes", () => {
  for (const p of ["/checkout", "/checkout/payment", "/payment/callback", "/cart"]) assert.equal(isUpdateDeferred(p), true, p);
  for (const p of ["/", "/products/cart-gin", "/journal"]) assert.equal(isUpdateDeferred(p), false, p);
});
