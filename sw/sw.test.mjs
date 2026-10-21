// Runtime tests for the *built* worker (public/sw.js) against an in-memory fake of the Cache API.
// This exercises the worker's logic, not a real browser; see docs/PWA.md for what still needs device testing.
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

execFileSync("node", ["scripts/build-sw.mjs"], { stdio: "ignore" });
const SOURCE = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const ORIGIN = "https://shop.test";

class FakeCache {
  entries = new Map();
  key = (r) => new URL(typeof r === "string" ? r : r.url, ORIGIN).href;
  async put(r, res) {
    this.entries.set(this.key(r), { status: res.status, statusText: res.statusText, headers: [...res.headers], body: Buffer.from(await res.arrayBuffer()) });
  }
  async match(r) {
    const e = this.entries.get(this.key(r));
    return e && new Response(e.body, { status: e.status, statusText: e.statusText, headers: e.headers });
  }
  async delete(r) {
    return this.entries.delete(this.key(r));
  }
  async keys() {
    return [...this.entries.keys()].map((url) => ({ url }));
  }
  async addAll(reqs) {
    for (const r of reqs) await this.put(r, await env.fetch(r));
  }
}

let env;
const asBasic = (res) => Object.defineProperty(res, "type", { value: "basic" });
const html = (body, headers = {}) => asBasic(new Response(body, { status: 200, headers: { "Content-Type": "text/html", ...headers } }));

function boot() {
  const handlers = {};
  const store = new Map();
  const timers = [];
  const calls = { fetch: [], skipWaiting: 0 };
  env = {
    handlers,
    store,
    calls,
    online: true,
    routes: { "/offline.html": () => html("OFFLINE PAGE"), "/icons/icon-192.png": () => html("png") },
    async fetch(r) {
      const path = new URL(typeof r === "string" ? r : r.url, ORIGIN).pathname;
      calls.fetch.push(path);
      if (!env.online) throw new TypeError("Failed to fetch");
      if (env.hang) return new Promise(() => {});
      return (env.routes[path] ?? (() => html(`page ${path}`, { "Cache-Control": "s-maxage=3600" })))();
    },
    flushTimers: () => timers.splice(0).forEach((t) => t()),
  };
  const ctx = {
    self: {
      location: { origin: ORIGIN },
      addEventListener: (type, fn) => (handlers[type] = fn),
      skipWaiting: () => calls.skipWaiting++,
      clients: { claim: async () => {} },
    },
    caches: {
      open: async (n) => (store.has(n) ? store.get(n) : (store.set(n, new FakeCache()), store.get(n))),
      keys: async () => [...store.keys()],
      delete: async (n) => store.delete(n),
      match: async (r) => {
        for (const c of store.values()) { const hit = await c.match(r); if (hit) return hit; }
        return undefined;
      },
    },
    fetch: (r) => env.fetch(r),
    Request: class { constructor(u, init = {}) { this.url = new URL(u, ORIGIN).href; Object.assign(this, init); } },
    Response, Headers, URL, Promise, Map, Date, Number, String, Boolean,
    setTimeout: (fn) => timers.push(fn),
  };
  vm.runInContext(SOURCE, vm.createContext(ctx));
}

const request = (path, over = {}) => ({ url: ORIGIN + path, method: "GET", mode: "navigate", ...over });

async function dispatchFetch(req) {
  const waits = [];
  const ev = { request: req, responded: false, respondWith(p) { this.responded = true; this.promise = Promise.resolve(p); }, waitUntil: (p) => waits.push(p) };
  env.handlers.fetch(ev);
  const res = ev.responded ? await ev.promise : null;
  await Promise.all(waits);
  return { responded: ev.responded, res };
}

async function lifecycle(type) {
  const waits = [];
  env.handlers[type]({ waitUntil: (p) => waits.push(p) });
  await Promise.all(waits);
}

async function post(data) {
  const waits = [];
  let reply;
  env.handlers.message({ data, ports: [{ postMessage: (v) => (reply = v) }], waitUntil: (p) => waits.push(p) });
  await Promise.all(waits);
  return reply;
}

beforeEach(boot);

test("install precaches the offline page and does NOT skip waiting", async () => {
  await lifecycle("install");
  const shell = [...env.store.keys()].find((n) => n.startsWith("lq-shell-"));
  assert.ok(shell);
  assert.equal(await (await env.store.get(shell).match("/offline.html")).text(), "OFFLINE PAGE");
  assert.equal(env.calls.skipWaiting, 0);
});

test("activate removes obsolete lq- caches but leaves other origins' caches alone", async () => {
  await lifecycle("install");
  await caches_open("lq-shell-oldbuild");
  await caches_open("lq-static-v0");
  await caches_open("foreign-cache");
  await lifecycle("activate");
  const names = [...env.store.keys()];
  assert.ok(!names.includes("lq-shell-oldbuild") && !names.includes("lq-static-v0"));
  assert.ok(names.includes("foreign-cache") && names.includes("lq-pages") === false);
  assert.ok(names.some((n) => n.startsWith("lq-shell-") && n !== "lq-shell-oldbuild"));
});
async function caches_open(name) {
  if (!env.store.has(name)) env.store.set(name, new FakeCache());
}

test("public pages: network first, saved, then served from the saved copy when offline (and flagged once)", async () => {
  await lifecycle("install");
  const first = await dispatchFetch(request("/spirits/rum"));
  assert.equal(first.res.status, 200);
  assert.ok(env.store.get("lq-pages").entries.has(ORIGIN + "/spirits/rum"));

  env.online = false;
  const offline = await dispatchFetch(request("/spirits/rum"));
  assert.equal(offline.res.status, 200);
  assert.equal(await offline.res.text(), "page /spirits/rum");

  assert.equal(await post({ type: "WAS_CACHED", url: ORIGIN + "/spirits/rum" }), true);
  assert.equal(await post({ type: "WAS_CACHED", url: ORIGIN + "/spirits/rum" }), false); // consumed
});

test("offline with no saved copy gives the offline page with a 503, never a fake success", async () => {
  await lifecycle("install");
  env.online = false;
  const { res } = await dispatchFetch(request("/spirits/never-visited"));
  assert.equal(res.status, 503);
  assert.equal(await res.text(), "OFFLINE PAGE");
});

test("slow network falls back to a saved copy after the timeout", async () => {
  await lifecycle("install");
  await dispatchFetch(request("/wine/red"));
  env.hang = true;
  const pending = dispatchFetch(request("/wine/red"));
  await new Promise((r) => setImmediate(r));
  env.flushTimers();
  assert.equal(await (await pending).res.text(), "page /wine/red");
});

test("private routes are never stored, and fail to the offline page", async () => {
  await lifecycle("install");
  for (const path of ["/checkout", "/account/orders/1", "/admin/products", "/payment/callback"]) {
    const ok = await dispatchFetch(request(path));
    assert.equal(ok.res.status, 200);
    env.online = false;
    const down = await dispatchFetch(request(path));
    assert.equal(down.res.status, 503, path);
    env.online = true;
  }
  const pages = env.store.get("lq-pages");
  assert.equal(pages?.entries.size ?? 0, 0);
  for (const [name, cache] of env.store) {
    if (!name.startsWith("lq-shell-")) assert.equal(cache.entries.size, 0, name);
  }
});

test("search pages are never saved", async () => {
  await lifecycle("install");
  await dispatchFetch(request("/search"));
  assert.equal(env.store.get("lq-pages")?.entries.size ?? 0, 0);
});

test("responses marked private or no-store are not saved even on public paths", async () => {
  await lifecycle("install");
  env.routes["/spirits/rum"] = () => html("personalised", { "Cache-Control": "private, no-cache, no-store" });
  await dispatchFetch(request("/spirits/rum"));
  assert.equal(env.store.get("lq-pages")?.entries.size ?? 0, 0);
});

test("API calls, other origins, non-GET and RSC fetches are left to the browser", async () => {
  await lifecycle("install");
  for (const req of [
    { url: "https://api.shop.test/api/v1/products", method: "GET", mode: "cors" },
    request("/api/v1/me", { mode: "cors" }),
    request("/checkout", { method: "POST" }),
    request("/spirits/rum", { mode: "cors" }),
  ]) {
    assert.equal((await dispatchFetch(req)).responded, false, req.url);
  }
});

test("hashed static assets are cache-first", async () => {
  await lifecycle("install");
  const req = request("/_next/static/chunks/app.js", { mode: "no-cors" });
  await dispatchFetch(req);
  const before = env.calls.fetch.length;
  const again = await dispatchFetch(req);
  assert.equal(again.res.status, 200);
  assert.equal(env.calls.fetch.length, before);
});

test("saved pages expire after 7 days", async () => {
  await lifecycle("install");
  await dispatchFetch(request("/journal/old-post"));
  const entry = env.store.get("lq-pages").entries.get(ORIGIN + "/journal/old-post");
  const idx = entry.headers.findIndex(([k]) => k === "x-sw-cached-at");
  entry.headers[idx][1] = String(Date.now() - 8 * 86400000);
  env.online = false;
  assert.equal((await dispatchFetch(request("/journal/old-post"))).res.status, 503);
});

test("page cache is bounded", async () => {
  await lifecycle("install");
  for (let i = 0; i < 40; i++) await dispatchFetch(request(`/products/p${i}`));
  assert.equal(env.store.get("lq-pages").entries.size, 30);
  assert.ok(env.store.get("lq-pages").entries.has(ORIGIN + "/products/p39"));
});

test("logout clears saved pages; update only activates when asked", async () => {
  await lifecycle("install");
  await dispatchFetch(request("/spirits/rum"));
  await post({ type: "CLEAR_USER_DATA" });
  assert.equal(env.store.has("lq-pages"), false);
  await post({ type: "SKIP_WAITING" });
  assert.equal(env.calls.skipWaiting, 1);
});
