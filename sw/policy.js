/*
 * Cache policy for the service worker. Pure functions only (no browser APIs) so they can be unit tested
 * with `node --test`. build-sw.mjs concatenates this file in front of sw.js.
 */

// Anything personal, transactional or administrative. Never cached, never answered from cache.
var PRIVATE_PREFIXES = [
  "/api", "/admin", "/staff", "/account", "/me", "/checkout", "/cart", "/orders", "/order",
  "/payment", "/payments", "/login", "/register", "/logout", "/wishlist", "/password",
  "/forgot-password", "/reset-password", "/dev",
];

// Pages that must not be saved even though they are not private: infinite URL space, personal intent.
var UNSAVED_PAGE_PREFIXES = ["/search", "/offline.html"];

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.indexOf(prefix + "/") === 0;
}

function isPrivatePath(pathname) {
  for (var i = 0; i < PRIVATE_PREFIXES.length; i++) {
    if (matchesPrefix(pathname, PRIVATE_PREFIXES[i])) return true;
  }
  return false;
}

/*
 * Category URLs come from the CMS, so there is no fixed list of public paths. A page is eligible for offline saving
 * unless it is private or a search page; the server's Cache-Control then has the final say (isCacheableResponse:
 * anything personalised must be sent as private/no-store and is never saved).
 */
function isCacheablePage(pathname) {
  if (isPrivatePath(pathname)) return false;
  for (var i = 0; i < UNSAVED_PAGE_PREFIXES.length; i++) {
    if (matchesPrefix(pathname, UNSAVED_PAGE_PREFIXES[i])) return false;
  }
  return true;
}

/**
 * Decide how to handle a request.
 * Returns one of: bypass | static | image | offline-page | page | navigation | private-navigation
 *  - bypass: do not call respondWith (browser handles it; nothing is cached).
 */
function classifyRequest(req) {
  if (req.method !== "GET") return "bypass";
  if (!req.sameOrigin) return "bypass"; // includes the Laravel API on its own origin
  var p = req.pathname;

  if (p === "/sw.js" || p === "/manifest.webmanifest") return "bypass";
  if (p === "/offline.html") return "offline-page";

  if (req.mode === "navigate") {
    if (isPrivatePath(p)) return "private-navigation";
    return isCacheablePage(p) ? "page" : "navigation";
  }

  if (isPrivatePath(p)) return "bypass";
  if (p.indexOf("/_next/static/") === 0 || p.indexOf("/icons/") === 0) return "static";
  if (p === "/_next/image") return "image";
  return "bypass"; // RSC payloads, route data, anything unknown
}

/**
 * Only successful, same-origin, non-redirected, shareable responses are stored.
 * Responses marked private/no-store by the server are never cached.
 */
function isCacheableResponse(res) {
  if (res.status !== 200 || res.type !== "basic" || res.redirected) return false;
  var cc = (res.cacheControl || "").toLowerCase();
  return cc.indexOf("no-store") === -1 && cc.indexOf("private") === -1;
}

function isFresh(cachedAt, now, maxAgeMs) {
  return typeof cachedAt === "number" && !isNaN(cachedAt) && now - cachedAt <= maxAgeMs;
}

function isObsoleteCache(name, keep) {
  return name.indexOf("lq-") === 0 && keep.indexOf(name) === -1;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { isPrivatePath, isCacheablePage, classifyRequest, isCacheableResponse, isFresh, isObsoleteCache };
}
