import test from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "./safe-next.ts";

test("same-site paths are kept", () => {
  assert.equal(safeNext("/checkout"), "/checkout");
  assert.equal(safeNext("/account/orders?page=2"), "/account/orders?page=2");
  assert.equal(safeNext(["/spirits/whiskey", "/other"]), "/spirits/whiskey");
});

test("anything that could leave the site falls back (no open redirect)", () => {
  for (const bad of ["https://evil.test", "//evil.test", "/\\evil.test", "javascript:alert(1)", "evil.test", "/ok\r\nSet-Cookie: x=1", "/a\\b", "", undefined, null, "/" + "x".repeat(400)]) {
    assert.equal(safeNext(bad), "/account", String(bad));
  }
  assert.equal(safeNext("https://evil.test", "/"), "/");
});

test("never redirects back into the auth pages", () => {
  for (const p of ["/login", "/login?next=/x", "/register", "/forgot-password", "/reset-password?token=1"]) assert.equal(safeNext(p), "/account", p);
  assert.equal(safeNext("/loginfo"), "/loginfo"); // look-alike paths are fine
});
