import assert from "node:assert/strict";
import test from "node:test";
import { isIconSize, logoIconUrl } from "./brand-icon.ts";

const logo = "https://res.cloudinary.com/demo/image/upload/branding/01ABC.webp";

test("asks Cloudinary for a padded square PNG", () => {
  assert.equal(
    logoIconUrl(logo, 192),
    "https://res.cloudinary.com/demo/image/upload/c_fit,w_161,h_161/c_pad,w_192,h_192,b_rgb:0f0b0a,f_png/branding/01ABC.webp",
  );
});

test("leaves a bigger margin for maskable icons", () => {
  assert.match(logoIconUrl(logo, 512, true) ?? "", /c_fit,w_307,h_307\/c_pad,w_512,h_512/);
});

test("keeps working with a transformation already in a custom base", () => {
  assert.match(logoIconUrl("https://img.example.com/image/upload/f_auto,q_auto/branding/x.webp", 32) ?? "", /^https:\/\/img\.example\.com\/image\/upload\/c_fit,w_27,h_27\/c_pad,w_32,h_32,b_rgb:0f0b0a,f_png\/f_auto,q_auto\/branding\/x\.webp$/);
});

test("gives nothing for missing, insecure or non-Cloudinary-style addresses", () => {
  assert.equal(logoIconUrl(null, 192), null);
  assert.equal(logoIconUrl("http://localhost:8000/storage/branding/x.webp", 192), null);
  assert.equal(logoIconUrl("https://cdn.example.com/logo.png", 192), null);
});

test("only the known icon sizes are allowed", () => {
  assert.equal(isIconSize(192), true);
  assert.equal(isIconSize(100), false);
});
