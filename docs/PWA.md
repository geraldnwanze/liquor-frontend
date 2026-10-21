# PWA foundation

Installable app shell, hand-written service worker, offline page, install and update UX. No PWA dependency was added.

## How it fits together
| Piece | Location |
| --- | --- |
| Manifest (generated, brand from `lib/brand.ts`) | `app/manifest.ts` -> `/manifest.webmanifest` |
| Icons (regenerate with `npm run icons`) | `public/icons/`, `app/icon.png`, `app/apple-icon.png` |
| Worker source / cache policy | `sw/sw.js`, `sw/policy.js` |
| Built worker (gitignored, built by `predev`/`prebuild`) | `public/sw.js` |
| Offline page (self-contained HTML) | `public/offline.html` |
| Registration, install, update, connectivity UI | `components/pwa/`, `lib/pwa/` |

The worker registers **in production builds only**, so `next dev` never serves stale cached assets.

## Caching rules (what the worker will and will not store)
- **Only same-origin GET requests are handled.** The Laravel API lives on its own origin and is never touched by the worker.
- `/_next/static/*`, `/icons/*`: cache-first (content-hashed, safe), max 150 entries.
- `/_next/image`: stale-while-revalidate, max 60 entries.
- **HTML pages**: network-first with a 4 s timeout, then the saved copy, then the offline page (HTTP 503). Because category URLs come from the CMS there is no fixed allow-list: every non-private, non-search page is eligible, and the server's `Cache-Control` decides (responses with `private` or `no-store`, redirects and non-200s are never saved). Max 30 pages, expire after 7 days.
- **Never cached or answered from cache**: `/api`, `/admin`, `/account`, `/checkout`, `/cart`, `/orders`, `/payment(s)`, `/login`, `/register`, `/forgot-password`, `/reset-password`, wishlist. Failed navigations to them show the offline page. Nothing is queued or retried automatically, so an order can never be submitted silently.
- RSC/soft-navigation fetches bypass the worker.
- **Rule for page authors:** HTML for allow-listed paths must not contain per-user content (cart count, account name, prices that depend on a session). Load personalised parts client-side from the API.
- On logout call `clearUserData()` (`lib/pwa/service-worker.ts`) to delete saved pages.
- A saved copy served on a full page load shows a "saved copy, may be out of date" notice.

If a new private area is added (anything per-user), add its prefix to `PRIVATE_PREFIXES` in `sw/policy.js` **and** make sure Next sends it as `private`/`no-store` (reading `cookies()`/`headers()` does this).

## Updates
A new worker waits; it is activated only when the customer taps **Update** (no automatic `skipWaiting`). The prompt is suppressed on `/checkout`, `/payment` and `/cart`. The build id in `public/sw.js` is a hash of `sw/*.js` and `offline.html`, so browsers update the worker exactly when those change. Obsolete `lq-*` caches are deleted on activation.

## Install UX
- Chromium: `beforeinstallprompt` is captured and a contextual banner appears after the second page view; "Not now" snoozes it 14 days, then 60, then 180. A header "Install app" button is always available (unless installed/unsupported).
- iOS Safari / other browsers without a prompt API: the same entry opens a step-by-step guide dialog (Add to Home Screen / browser menu / Add to Dock).
- Facebook/Instagram/TikTok in-app browsers: guide explains how to open in a real browser.
- Desktop Firefox cannot install web apps: the install UI is hidden.
- Standalone mode is detected, so install prompts never show inside the installed app. A branded splash overlay shows only in standalone mode until hydration (with a 3 s CSS safety timeout).

## Deployment checklist
1. **HTTPS** is required in production (service workers only run on HTTPS or localhost). Terminate TLS at Cloudflare/host and redirect HTTP to HTTPS.
2. Serve `/sw.js` with `Cache-Control: no-cache` and `Service-Worker-Allowed: /` (already set in `next.config.ts`; keep these if a CDN or proxy sits in front, and do not let Cloudflare cache `/sw.js`).
3. Run `npm run build` (the `prebuild` hook regenerates `public/sw.js`). Build needs access to Google Fonts (`next/font/google`), or switch to `next/font/local`.
4. Environment variables (all optional, defaults in `lib/brand.ts`): `NEXT_PUBLIC_SITE_URL` (set this in production: canonical/metadata base), `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_SHORT_NAME`, `NEXT_PUBLIC_APP_DESCRIPTION`, `NEXT_PUBLIC_THEME_COLOR`, `NEXT_PUBLIC_BACKGROUND_COLOR`.
5. Keep `/offline.html` out of search results (served with `X-Robots-Tag: noindex`).

## Tests
`npm test` (Node's built-in runner, no extra dependencies):
- `sw/policy.test.mjs`: cache classification, private-route rules, cacheability, expiry, cleanup.
- `sw/sw.test.mjs`: runs the **built** `public/sw.js` against an in-memory Cache API: precache, activation cleanup, offline fallback (503), saved-page serving, slow-network fallback, private routes never stored, no-store never stored, API/cross-origin bypass, cache bounds, 7-day expiry, logout clear, update only on request.
- `lib/pwa/pwa-policy.test.mjs`: platform detection, install modes/guides, snooze, banner rules, update deferral.

## What has and has not been verified
Verified (production build, `next start`, in-app browser pane at 375x812): manifest content, icon files and MIME types, worker file headers, offline page rendering, install banner/header button/guide dialog/snooze behaviour, online/offline banners. The install prompt and offline events there were **synthetic** (dispatched by script).

**Not verified in a real browser:** service worker registration, caching, offline reload, update flow and real `beforeinstallprompt`/`appinstalled`. The embedded browser pane used for testing blocks all service-worker script fetches. The worker logic is covered only by the Node tests above. Before launch, test on: Android Chrome, iOS Safari (add to Home Screen), desktop Chrome and Edge, using DevTools > Application (Manifest, Service Workers, Cache Storage) and Lighthouse, over HTTPS (or `localhost`).

## Not built yet (needs the storefront/backend first)
Cart persistence and revalidation, checkout interruption handling, CMS-managed PWA branding and offline-page content, push notifications (subscription storage, VAPID, dispatch, click deep links), bottom navigation, pull-to-refresh, product-catalogue caching beyond the allow-listed HTML pages, app screenshots in the manifest. No push code exists, so nothing here claims push works.
