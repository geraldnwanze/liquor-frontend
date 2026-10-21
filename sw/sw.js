/* Premium Liquor service worker. Source: sw/sw.js (+ sw/policy.js). Built into public/sw.js by scripts/build-sw.mjs. */
/* global BUILD_ID, classifyRequest, isCacheableResponse, isFresh, isObsoleteCache */
"use strict";

var CACHE_SHELL = "lq-shell-" + BUILD_ID; // offline page + icons; replaced on every changed build
var CACHE_STATIC = "lq-static"; // content-hashed assets: safe to keep across deploys, trimmed by size
var CACHE_IMAGES = "lq-images";
var CACHE_PAGES = "lq-pages"; // public pages only; also cleared on logout
var KEEP = [CACHE_SHELL, CACHE_STATIC, CACHE_IMAGES, CACHE_PAGES];

var LIMITS = { static: 150, images: 60, pages: 30 };
var PAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
var NETWORK_TIMEOUT_MS = 4000; // slow mobile networks: fall back to a saved page instead of waiting
var CACHED_AT = "x-sw-cached-at";

// Pages served from cache recently, so the page can warn that data may be stale (see WAS_CACHED).
var servedFromCache = new Map();

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_SHELL).then(function (cache) {
      return cache.addAll([
        new Request("/offline.html", { cache: "reload" }),
        new Request("/icons/icon-192.png", { cache: "reload" }),
      ]);
    }),
  );
  // No skipWaiting(): the page decides when to activate an update, so checkout is never interrupted.
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names.filter(function (n) { return isObsoleteCache(n, KEEP); }).map(function (n) { return caches.delete(n); }),
        );
      })
      .then(function () { return self.clients.claim(); }),
  );
});

self.addEventListener("message", function (event) {
  var data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (data.type === "CLEAR_USER_DATA") {
    // Called on logout. Defensive: only public pages are stored, but nothing should outlive a session.
    servedFromCache.clear();
    event.waitUntil(caches.delete(CACHE_PAGES));
  } else if (data.type === "WAS_CACHED" && event.ports && event.ports[0]) {
    var key = String(data.url || "");
    var at = servedFromCache.get(key);
    servedFromCache.delete(key);
    event.ports[0].postMessage(Boolean(at && Date.now() - at < 60000));
  }
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  var url = new URL(req.url);
  var kind = classifyRequest({
    method: req.method,
    mode: req.mode,
    pathname: url.pathname,
    sameOrigin: url.origin === self.location.origin,
  });

  switch (kind) {
    case "static":
      event.respondWith(cacheFirst(req, CACHE_STATIC, LIMITS.static));
      break;
    case "image":
      event.respondWith(staleWhileRevalidate(event, req, CACHE_IMAGES, LIMITS.images));
      break;
    case "offline-page":
      event.respondWith(offlineResponse());
      break;
    case "page":
      event.respondWith(pageStrategy(event, req, url));
      break;
    case "navigation":
    case "private-navigation":
      // Network only. Never stored. If it fails, show the offline page.
      event.respondWith(fetch(req).catch(offlineResponse));
      break;
    default:
      break; // bypass
  }
});

function offlineResponse() {
  return caches.match("/offline.html").then(function (cached) {
    if (!cached) return new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain" } });
    // 503, not 200: an offline notice must never look like a successful page load.
    return new Response(cached.body, { status: 503, statusText: "Offline", headers: cached.headers });
  });
}

function cacheFirst(req, cacheName, max) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res.status === 200 && res.type === "basic") {
          cache.put(req, res.clone()).then(function () { return trim(cacheName, max); });
        }
        return res;
      });
    });
  });
}

function staleWhileRevalidate(event, req, cacheName, max) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(req).then(function (hit) {
      var refresh = fetch(req).then(function (res) {
        if (res.status === 200 && res.type === "basic") {
          return cache.put(req, res.clone()).then(function () { return trim(cacheName, max); }).then(function () { return res; });
        }
        return res;
      });
      if (hit) {
        event.waitUntil(refresh.catch(function () {}));
        return hit;
      }
      return refresh;
    });
  });
}

function pageStrategy(event, req, url) {
  var network = fetch(req).then(function (res) {
    var info = { status: res.status, type: res.type, redirected: res.redirected, cacheControl: res.headers.get("Cache-Control") };
    if (isCacheableResponse(info)) event.waitUntil(storePage(req, res.clone()));
    return res;
  });

  var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, NETWORK_TIMEOUT_MS); });

  return Promise.race([network, timeout])
    .then(function (res) {
      if (res) return res;
      // Network is slow: prefer a saved copy if there is one, otherwise keep waiting for the network.
      return savedPage(req).then(function (saved) {
        if (saved) {
          markServedFromCache(url);
          return saved;
        }
        return network;
      });
    })
    .catch(function () {
      return savedPage(req).then(function (saved) {
        if (saved) {
          markServedFromCache(url);
          return saved;
        }
        return offlineResponse();
      });
    });
}

function markServedFromCache(url) {
  servedFromCache.set(url.href, Date.now());
}

function storePage(req, res) {
  var headers = new Headers(res.headers);
  headers.set(CACHED_AT, String(Date.now()));
  return caches.open(CACHE_PAGES).then(function (cache) {
    return res
      .blob()
      .then(function (body) {
        return cache.put(req.url, new Response(body, { status: res.status, statusText: res.statusText, headers: headers }));
      })
      .then(function () { return trim(CACHE_PAGES, LIMITS.pages); });
  });
}

function savedPage(req) {
  return caches.open(CACHE_PAGES).then(function (cache) {
    return cache.match(req.url).then(function (hit) {
      if (!hit) return null;
      var at = Number(hit.headers.get(CACHED_AT));
      if (!isFresh(at, Date.now(), PAGE_MAX_AGE_MS)) {
        cache.delete(req.url);
        return null;
      }
      return hit;
    });
  });
}

// Oldest entries first (Cache keys are in insertion order).
function trim(name, max) {
  return caches.open(name).then(function (cache) {
    return cache.keys().then(function (keys) {
      var excess = keys.length - max;
      var jobs = [];
      for (var i = 0; i < excess; i++) jobs.push(cache.delete(keys[i]));
      return Promise.all(jobs);
    });
  });
}
