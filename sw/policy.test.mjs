import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { isPrivatePath, isCacheablePage, classifyRequest, isCacheableResponse, isFresh, isObsoleteCache } = createRequire(import.meta.url)("./policy.js");

const req = (over) => ({ method: "GET", mode: "same-origin", pathname: "/", sameOrigin: true, ...over });

test("private paths are detected, including nested ones, without matching look-alikes", () => {
  for (const p of ["/checkout", "/checkout/pay", "/account/orders/12", "/admin", "/api/v1/me", "/payment/callback", "/cart", "/forgot-password", "/reset-password", "/login", "/staff/login", "/orders/LQABC"]) {
    assert.equal(isPrivatePath(p), true, p);
  }
  for (const p of ["/", "/products/accountant-gin", "/spirits/whiskey", "/journal/cart-guide"]) {
    assert.equal(isPrivatePath(p), false, p);
  }
});

test("public pages are eligible; private and search pages are not", () => {
  for (const p of ["/", "/spirits", "/spirits/whiskey", "/products/some-rum", "/journal/how-to-choose", "/anything-cms-defined"]) {
    assert.equal(isCacheablePage(p), true, p);
  }
  for (const p of ["/checkout", "/account", "/search", "/search/gin", "/api/v1/products", "/offline.html"]) {
    assert.equal(isCacheablePage(p), false, p);
  }
});

test("classification routes requests to the right strategy", () => {
  assert.equal(classifyRequest(req({ pathname: "/_next/static/chunks/a.js" })), "static");
  assert.equal(classifyRequest(req({ pathname: "/icons/icon-192.png" })), "static");
  assert.equal(classifyRequest(req({ pathname: "/_next/image" })), "image");
  assert.equal(classifyRequest(req({ pathname: "/offline.html" })), "offline-page");
  assert.equal(classifyRequest(req({ mode: "navigate", pathname: "/spirits/rum" })), "page");
  assert.equal(classifyRequest(req({ mode: "navigate", pathname: "/search" })), "navigation");
  assert.equal(classifyRequest(req({ mode: "navigate", pathname: "/whiskey-and-more" })), "page");
  assert.equal(classifyRequest(req({ mode: "navigate", pathname: "/checkout" })), "private-navigation");
});

test("cross-origin (Laravel API), non-GET, RSC and private subrequests bypass the worker", () => {
  assert.equal(classifyRequest(req({ sameOrigin: false, pathname: "/api/v1/products" })), "bypass");
  assert.equal(classifyRequest(req({ method: "POST", pathname: "/checkout" })), "bypass");
  assert.equal(classifyRequest(req({ pathname: "/spirits/rum" })), "bypass"); // RSC fetch, not a navigation
  assert.equal(classifyRequest(req({ pathname: "/api/v1/me" })), "bypass");
  assert.equal(classifyRequest(req({ pathname: "/sw.js" })), "bypass");
  assert.equal(classifyRequest(req({ pathname: "/account/_next/static/x.js" })), "bypass");
});

test("responses are cached only when successful, basic, direct and shareable", () => {
  const ok = { status: 200, type: "basic", redirected: false, cacheControl: "s-maxage=31536000" };
  assert.equal(isCacheableResponse(ok), true);
  assert.equal(isCacheableResponse({ ...ok, cacheControl: null }), true);
  assert.equal(isCacheableResponse({ ...ok, status: 404 }), false);
  assert.equal(isCacheableResponse({ ...ok, status: 301 }), false);
  assert.equal(isCacheableResponse({ ...ok, type: "opaque" }), false);
  assert.equal(isCacheableResponse({ ...ok, redirected: true }), false);
  assert.equal(isCacheableResponse({ ...ok, cacheControl: "private, no-cache" }), false);
  assert.equal(isCacheableResponse({ ...ok, cacheControl: "NO-STORE" }), false);
});

test("freshness and obsolete-cache cleanup", () => {
  assert.equal(isFresh(1000, 2000, 5000), true);
  assert.equal(isFresh(1000, 9000, 5000), false);
  assert.equal(isFresh(NaN, 2000, 5000), false);
  const keep = ["lq-shell-b", "lq-static", "lq-images", "lq-pages"];
  assert.equal(isObsoleteCache("lq-shell-a", keep), true);
  assert.equal(isObsoleteCache("lq-static", keep), false);
  assert.equal(isObsoleteCache("someone-elses-cache", keep), false);
});
