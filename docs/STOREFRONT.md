# Storefront (catalogue pages)

## Routes
| URL | Source |
| --- | --- |
| `/` | featured categories + new arrivals from the API (CMS homepage builder not built yet) |
| `/[category]` e.g. `/spirits` | root category; includes products of its children |
| `/[category]/[sub]` e.g. `/spirits/whiskey` | must match the real hierarchy, else 404. `/whiskey` 308-redirects to `/spirits/whiskey` |
| `/products/[slug]` | product detail: variants, tasting notes, JSON-LD `Product` + `BreadcrumbList` |
| `/sitemap.xml`, `/robots.txt` | generated from the API |

Filters, search-in-category, sort and pagination are a plain GET form (`?q=&sort=&min_price=&max_price=&in_stock=1&page=`). Invalid values are dropped by `lib/listing-params.ts`. Canonical URL is always the base path.

## Configuration
Copy `.env.example` to `.env.local`. `API_BASE_URL` is required in production and is only ever read on the server.

**`next build` needs the Laravel API reachable and seeded**: dynamic routes are prerendered from real slugs (`generateStaticParams`), and a failed API call fails the build rather than baking in empty pages. Deploy/start the API before building.

## Cart and checkout
- **Cart token** is a bearer secret for the guest cart, so it lives in an **httpOnly cookie** (`lq_cart`) set by our server; page scripts can never read it. `lq_has_cart=1` is a non-secret flag so the browser only asks for a cart when one exists. Cart/checkout calls are Server Actions (`app/actions`), which forward the token to Laravel; the browser never talks to the API for commerce, so there is no CORS surface.
- **Never trusted:** the browser sends only variant ids, quantities and contact/address details. Prices, fees, totals, stock and the age rule are computed and enforced by Laravel (re-checked at every cart read and at checkout).
- **Cart drawer** (native `<dialog>`), add-to-cart on the product page, header badge. A line that becomes unavailable or short on stock stays visible with the reason (and a "Reduce to N" action); it is never silently removed, and checkout is blocked until it is resolved.
- **Checkout** (`/checkout`, noindex, never saved by the service worker): delivery state/city come from the staff-managed zones; a city we don't serve is flagged before submit; the real delivery fee is fetched from the server for the entered address. The age checkbox shows the configured minimum age.
- **Retry safety:** one idempotency key per distinct submission (created at submit time, renewed when any field changes). After a dropped connection, "try again" reuses the key, so it cannot create a second order.
- **Offline:** the last cart is kept as a labelled *saved copy* (no personal data), mutations and checkout are disabled with an explanation, nothing is queued, and the cart is re-fetched and re-validated when the connection returns. Only the delivery state/city is kept (per tab) if checkout is interrupted.
- **`/orders/[reference]`** is readable only by the browser whose cart placed the order (the API returns 404 to anyone else). It currently shows a "payment not available yet" notice; this is where payment will start.

## Accounts
- **Pages:** `/login`, `/register`, `/forgot-password`, `/reset-password` and, behind sign-in, `/account` (details + password), `/account/orders`, `/account/orders/[reference]`, `/account/addresses`. All are `noindex` and never saved by the service worker. Guest checkout still works: signing in is optional and only adds saved details and order history.
- **Session:** the API token is an httpOnly cookie (`lq_session`, expiry matches the token) held by our server and forwarded as a Bearer token by Server Actions (`app/actions/auth.ts`, `account.ts`). `lq_has_session` is a non-secret flag. `proxy.ts` redirects `/account/*` to sign-in when the cookie is absent; every account page also verifies the session with the API (`requireUser`), so a forged or revoked cookie shows nothing.
- **Sign-in merges the guest cart** into the customer's cart on the server; the guest cookie is then dropped. Sign-out revokes the token on the API, clears the cookies, the saved cart copy, and the service worker's saved pages.
- **No per-user HTML in shared pages:** the header decides "Sign in" vs "Account" in the browser from the flag cookie (and re-checks on every route change, announcing changes so the cart reloads), so cached/saved pages are identical for everyone.
- **Open-redirect safe:** the post-login `next` is accepted only if it is a same-site path (`lib/auth/safe-next.ts`, tested).
- **Checkout for signed-in customers:** details prefilled, saved addresses selectable, optional "save this address".
- **Password reset:** the emailed link points to `/reset-password` on this site (set `FRONTEND_URL` in the API). The API answers identically for unknown emails, and a reset (or password change) signs out other devices. In development mail goes to the API's log (`MAIL_MAILER=log`); configure a real mailer before launch.
- **Rate limits:** all customer traffic reaches the API from this server, so login/reset limits are keyed on email + client IP. Set `TRUSTED_PROXIES` on the API so it honours the `X-Forwarded-For` header we forward; otherwise every customer shares one IP and only the per-email limit protects an account.
- **Not built:** email verification, email change, account deletion, social login, two-factor authentication.

## Payments
- **Pay now** appears on an unpaid order's page (`/orders/[reference]` and the account order page). It lists only the gateways the API reports as available (enabled and configured), then sends the customer to that gateway's own page, where card details are entered: they never touch this site. It needs a connection and is never retried automatically.
- **Return page** `/payment/return/[reference]` (private, noindex, never saved offline). It ignores every query parameter the gateway adds (`status`, `trxref`, `transaction_id`, ...) and only asks our server, which asks the gateway. It polls with backoff for up to 90 s, then offers "Check again" without ever telling the customer to pay twice. States: confirming, paid, failed/abandoned (retry), needs review (money received, do not pay again), connection lost, still waiting.
- **Local simulator:** with `ENABLE_FAKE_PAYMENTS=1` here and `PAYMENTS_FAKE_GATEWAY=true` on the API, a "Test payment" method appears and `/dev/pay/[reference]` lets you pick success/decline/abandon. It does not exist in production (the API refuses it).
- The server action `app/actions/payments.ts` sends only the order reference and the chosen gateway. The amount is always the order total held by Laravel.

## Data freshness
Reads go through `'use cache'` functions in `lib/api/catalog.ts`: products 60 s, categories 5 min, tagged (`products`, `product:<slug>`, `categories`) for on-demand revalidation. Pages can therefore be up to about a minute behind the admin. This is display only: cart and checkout must re-price and re-check stock on the server.

## Known limitations
- **`partialPrefetching` is off** (`next.config.ts`) so unknown slugs return a real 404 and `/whiskey` 308-redirects on the very first request (verified: with it on, the first visit got HTTP 200 with the not-found UI). The cost is no app-shell prefetch for soft navigations. Next says the option will be removed in the next major; at that point use a Proxy slug check.
- No wishlist, notification preferences or email change/verification, no discount codes, no brand pages (no public brand endpoint), no search page, no real product photos (placeholder shown; image hosts via `IMAGE_HOSTS`).
- Category depth is two levels.
- Laravel does not yet call a revalidation webhook when admins edit the catalogue.
- Age gate and compliance controls are not implemented; the footer and product notices are generic text, not legal advice.

## Admin orders (staff)
Routes: `/admin` (dashboard counts), `/admin/orders` (search, status/payment/fulfilment/date filters, pagination), `/admin/orders/[reference]` (items, customer, payments, refunds, history, fulfilment, dispatch, notes, cancel, per-payment refund) and `/admin/orders/[reference]/receipt`.
- `proxy.ts` sends visitors without a session cookie to sign in; `requireStaff()` then checks the account is staff (customers get a 404). The API re-checks every action, so `can()` only hides buttons.
- Writes are Server Actions in `app/actions/admin.ts`; refunds send one idempotency key per attempt (kept until success). Amounts are typed in naira and converted to integer kobo with `nairaToKobo`.
- Staff-only data (carrier phone, internal notes) is never part of the customer order response.
- Status: production build, type check, lint and Node tests pass. **Not yet exercised in a browser against a running API.**

## Admin products (staff)
Routes: `/admin/products` (status tabs, search by name or SKU, category filter), `/admin/products/new`, `/admin/products/[id]` (details, variants, stock, images, duplicate/archive/delete).
- Needs `catalog.manage`. Stock adjustment and history also need `inventory.manage`; the cost price field only appears with `catalog.view-cost` (the API strips it otherwise). The sidebar hides links a role can't use, but the API is what enforces access.
- Prices are typed in naira and sent as integer kobo (`nairaToKobo` / `koboToNairaInput`). Stock is only ever changed through a recorded adjustment (reason + note); there is no "set quantity" field.
- A product is created as a draft; publishing needs at least one active variant (the API refuses otherwise). Only draft or archived products can be deleted, and a variant that still has stock can't be deleted.
- Photos are uploaded from the Images section (see below); the shop shows a bottle illustration when a product has none.
- Every successful change expires the shop's `products` cache tag, so edits appear on the storefront straight away.
- Delete, archive and duplicate use a two-step confirm button.
- Status: build, type check, lint and Node tests pass; create, edit, add variant, edit variant, adjust stock, stock history, add image, publish, archive and delete were exercised in a browser against the API. Not exercised: image reorder/edit, duplicate, a role without `catalog.manage` opening these URLs, a role with `catalog.view-cost`.

## Discounts (customer and staff)
**Customer:** a "Have a discount code?" box in the cart drawer and in the checkout order summary (`components/cart/discount-box.tsx`). The browser only sends the typed code; Laravel decides whether it works and by how much (rules and stacking: backend `docs/ARCHITECTURE.md`, "Discounts"). One code per order; applying another replaces it. A code that stops working after being applied stays visible with the reason ("It isn't reducing your total") and never lowers the price. If a code fails when the order is placed, no order is created, the cart is reloaded and the form explains that nothing was charged. The order page, receipt and admin order page show the code and the discount.

**Staff** (`promotions.manage`): `/admin/discounts` (status tabs, search), `/admin/discounts/new`, `/admin/discounts/[id]` (settings, usage and recent redemptions, delete). Types: percentage (optional cap), fixed amount, free delivery; scope: whole order, chosen products (type-ahead picker) or chosen categories; minimum order; start/end typed in Nigerian time; total and per-customer limits; on/off. Money is typed in naira and sent as kobo. A code that has been used can't be deleted (switch it off). Promotions staff don't need catalogue access: products and categories come from `GET /admin/discounts/targets`.

**Status:** exercised in a browser against the API: wrong code, applying a percentage code in the drawer and at checkout, placing and paying the discounted order, per-customer limit and the "no longer works" message, free-delivery code at checkout, creating a product-specific code with the picker, deleting an unused code, usage and redemption shown after payment. **Not exercised in a browser:** category-scoped codes, scheduled/expired codes, editing an existing code, the delete refusal for a used code (covered by backend tests), and any real gateway.

## Admin customers (support)
Routes: `/admin/customers` (search by name, email or phone) and `/admin/customers/[id]` (contact, saved addresses, spend and recent orders, support notes). Needs `customers.manage` (customer support, store manager, super admin); order numbers link to the order page only for roles that can open orders.
- Staff accounts are never listed or opened here. Spend is paid orders before refunds.
- Support notes are internal: plain text, attributed to the writer, audited, never returned to the customer. They are deleted through the customer they belong to, so a note id from another customer is a 404.
- Not built: editing a customer, deactivating an account, merging guest orders into an account, a CSV export, and a staff-accounts screen.
- Status: exercised in a browser: list, detail, add note, delete note. Search and pagination are covered by backend tests only.

## Admin settings
`/admin/settings` (business details for receipts and ordering limits, needs `settings.manage`) and `/admin/settings/delivery` (delivery zones: fee, free-delivery threshold, estimated days, on/off, notes; needs `shipping.manage`). A role with only delivery access is sent straight to the zones tab. Saving expires the shop's `settings` or `delivery` cache tag, so checkout limits and zones change straight away. Money is typed in naira and sent as kobo.
- Status: type check, lint and tests pass; verified in a browser: saving business details (they appear on a receipt) and editing a delivery zone fee. **Not exercised in a browser:** the limit validation messages, adding or deleting a zone, and the storefront picking up a changed limit (the backend tests cover the API side).

## Admin staff and roles
`/admin/staff` (needs `staff.manage`, which only super administrators hold). Team list with roles; invite by name, email and roles; edit someone's roles; resend an invitation; deactivate or reactivate. Roles are the fixed ones from the backend (no custom role editor); the page lists what each can do in plain words (`lib/admin/permission-labels.ts`).
- An invitation emails a single-use "set your password" link (the normal password-reset page; it expires, 60 minutes by default). No password is ever sent or shown. Deactivating signs the person out everywhere immediately.
- You can't change your own roles or deactivate yourself, and the last active super administrator can't be demoted or deactivated (the API refuses both).
- Status: type check, lint and tests pass; verified in a browser: the page, sending an invitation, editing roles, deactivating. **Not exercised in a browser:** setting a password from the link and signing in as the invited person (covered end to end by backend tests), reactivating, resending an invitation, and the refusal messages.

## Visual design: dark luxe shop
The customer shop (`app/(shop)`) is dark with gold accents; the admin (`app/admin`) stays light. The theme is a token remap, not a rewrite: `.luxe` in `app/globals.css` re-points `--color-white` (raised surfaces), `--color-ink` / `--color-muted` (text), `--color-burgundy` (button fill, hairlines), `--color-accent` (gold headings/links) and `--color-midnight`. The wrapper lives in `app/(shop)/layout.tsx` and wraps the cart provider, so the cart drawer is themed too; nothing outside the shop (admin, root error/404 pages) is affected.
- **Rules for new shop UI:** use the tokens, never hard-coded light colours. `bg-white` means "raised card" (dark here), `text-accent` is the heading/link colour (not `text-burgundy`), primary buttons are `bg-gold text-midnight`, secondary/outline use `border-gold/… text-accent`. Success text on dark uses `text-emerald-400`, errors `text-rose-300`. Form controls use `border-ink/40` (3:1 against the surface).
- Headings (`h1`/`h2`) use Playfair Display (`--font-display`); body is Geist.
- **No photos yet:** products without an image show `BottleArt` (an SVG), so the shop looks finished before any photography exists.
- **Print:** an `@media print` block in `.luxe` forces a light palette and the site header/footer are `print:hidden`, so receipts print as before.
- **Filters** use `components/ui/collapsible-filters.tsx` (collapsed on phones, always shown from `sm`). A closed `<details>` can't do this: its content stays hidden at every width.
- Browser theme colour and the install splash background are now the dark page colour (`lib/brand.ts`); the app icons are unchanged.
- Error text and error borders use `text-danger` / `border-danger` (rose on the dark shop, wine on the light admin), never `text-accent`: gold doesn't read as an error.
- The static offline page (`public/offline.html`) repeats the dark palette by hand because it must work with no network; keep it in step with `.luxe` if the colours change.
- **Verified in a browser:** home, category, product, cart drawer, checkout, order page, receipt, account, sign-in (including the wrong-password error), register, forgot-password, the payment return page in its pending, failed and success states, the simulator page, and the offline page; phone width for home and product.
- **Print:** the browser tool can't switch to print mode, so the `@media print` rules were checked by applying them as ordinary CSS on the receipt page (site header/footer hidden, white page, dark text, print buttons hidden). A real "Print or save as PDF" from a desktop browser has not been tried.
- **Not checked:** the reset-password page's success state, the payment return page's "needs review" and "pending a long time" states, and real product photos (all demo products use the placeholder).

## Product photo uploads
In the product's Images section staff choose a photo (JPEG, PNG or WebP, 400-4500 px, up to 5 MB) and an optional description, and press Upload. The first photo is the "Main image" shown on cards and the product page; "Make main image" moves another to the front; "Remove" deletes it and its file. The picked file is previewed and checked in the browser first (type and size, with a clear message), then sent through a Server Action (`uploadImageAction`, `lib/api/admin.ts` `adminUpload`) as multipart to the API, which re-encodes it (rules in the backend `docs/ARCHITECTURE.md`, "Product photos").
- **Config to know about:** `next.config.ts` allows 6 MB request bodies for Server Actions (the default 1 MB would reject phone photos) and `IMAGE_HOSTS` must list the host the photos are served from (a bare name means https; use `http://localhost:8010` style for a local API). **`IMAGE_ALLOW_LOCAL_IP=1` is for local development only** (Next otherwise refuses to fetch images from private addresses); never set it in production.
- Local run: backend `php artisan storage:link` with `APP_URL` set to the API address you actually use, then start the shop with `IMAGE_HOSTS=http://localhost:8010 IMAGE_ALLOW_LOCAL_IP=1`.
- Admin routes are declared blocking (`instant = false` in `app/admin/layout.tsx`): they are per-person data behind sign-in.
- **Verified in a browser (production build):** uploading a real file (a 1800x2400 JPEG became a 1200x1600 WebP of 6 KB), the preview, the main-image badge, the photo appearing on the shop product page through Next's image optimiser, the wrong-type and over-size messages, making another photo the main image, and removing a photo (its file is deleted). **Not exercised:** a real phone photo, drag-and-drop, the S3 disk, and uploads from Safari/iOS.

## Admin reports
`/admin/reports` (needs `reports.view`): quick ranges (7, 30, 90 days, this month, last month) or custom dates and grouping (day, week, month), all in Nigerian time; summary cards (sales, orders, average order, discounts given, refunded, after refunds); sales per period as a bar chart (plain SVG, no chart library) with the same numbers in "View as a table"; top products (by revenue or units); discount codes used; and low stock. Each table has a **Download CSV** button that builds the file in the browser (nothing is uploaded); cells that a spreadsheet could read as a formula are defused, and amounts are written in plain naira. What each number means is defined in the backend `docs/ARCHITECTURE.md`, "Reports".
- The range is read from the URL and validated (`lib/admin/report-range.ts`, with tests); anything unusable falls back to the last 30 days.
- **Verified in a browser (production build):** the cards, chart, tables and week grouping against the dev data (five paid orders, ₦122,500, one ₦1,500 discount, one ₦1,000 refund, 4 rum and 1 champagne sold; the cancelled order is excluded), and the top of the page at phone width. **Not exercised:** a downloaded CSV opened in a spreadsheet, month grouping in the UI, the chart and tables at phone width, the low-stock table with real low items (backend-tested), and a large data set.

## Search, wishlist, reviews, newsletter and the phone tab bar
- **Search:** the header box answers as you type (a dropdown of up to 6 matches with photo, brand and price, from the first character, on every key release; arrow keys, Enter and Escape work, and "See all results" opens the full list). It reads `/api/search`, which calls the public products API; stale requests are cancelled. Without JavaScript it is a plain form to `/search`, which shares one listing with the category pages. Results pages are `noindex`. Matching is on product name and brand only.
- **Wishlist:** hearts on cards and product pages. Which hearts are filled is loaded in the browser (shop pages are shared HTML), so guests see empty hearts and are sent to sign in when they tap one. `/account/wishlist` lists saved products.
- **Reviews:** shown on each product page; the form appears only for customers the API says have bought the product. New reviews wait for approval in Admin → Reviews. Star ratings appear on cards and in the product's structured data only once real approved reviews exist.
- **Best sellers** row on the home page appears only once something has sold.
- **Review extras:** up to 3 photos per review (checked in the browser, then by the API), a public "Reply from the shop", and a "Delete my review" button for the author. The Server Action body limit is 16 MB because three 5 MB photos must fit.
- **Newsletter:** footer form with an un-ticked consent box; confirmation and unsubscribe pages use a button press (so email scanners opening links change nothing). Admin → Newsletter shows totals and a CSV export, and Admin → Newsletter → Campaigns writes drafts, sends a test to yourself, and sends to everyone after a confirm step that names how many people will receive it.
- **Phone tab bar:** Home, Shop, Saved, Cart, Account, shown below the `md` breakpoint.

## Staff dashboard and Pages
The admin dashboard is per role: anyone with a staff permission gets a workspace of the numbers they can act on, plus the order overview for roles that see orders. Admin → Pages (content editors, marketing, store managers) writes information pages, shown at `/info/{slug}` and linked from the footer once published. See the backend `docs/ARCHITECTURE.md` for the role table.

## Staff portal
Staff sign in at `/staff/login`, a separate page with its own session cookie (`lq_staff_session`). Unauthenticated visits to `/admin` are sent there; a customer session does not open the admin, and the customer sign-in refuses staff accounts. Signing out of the admin ends only the staff session.

## Identifiers
All ids are UUID strings (`lib/ids.ts` has `isUuid`, used to reject malformed ids before they reach an API path). Cart, address, product, staff and every admin record id is a string in the types and Server Actions.

## Live search in the admin
Search boxes on the Customers, Products, Discounts and Orders lists update the results as you type: on every key release the text goes into the address bar's `q` and the server re-renders the list (other filters are kept, the page number resets, and a newer keystroke replaces an unfinished one). Enter still works as a normal form submit. The shorter lists (Staff, Pages, Reviews, Newsletter subscribers) have an instant filter that hides non-matching rows in the browser, matching on the visible fields (not the hidden edit forms).

## Business logo
Admin → Settings → Business logo uploads, replaces or removes the logo. It replaces the monogram in the shop header and footer (the name stays for screen readers), and appears on receipts, in the admin sidebar and on the staff sign-in page. With no logo, everything falls back to the monogram and the name. The favicon and installed-app icons are not changed by it.

## Deleting
Every "Delete" in the shop and admin is a soft delete on the server: the record is hidden, not erased, and can be brought back with the backend's `trash:restore` command (there is no restore screen yet). See the backend `docs/ARCHITECTURE.md`.

## Categories and brands (admin)
Admin → Categories and Admin → Brands (permission `catalog.manage`: store manager, product manager, super admin) create, list and edit them. Categories show as a tree (sub-categories indented under their parent) with product counts, and can be placed under any other category, ordered, hidden or featured on the home page. Brands carry a country, logo address and featured flag. Saving expires the shop's cached categories and product lists so a change shows straight away. Each row's Edit panel also has a Delete button (a soft delete, restorable with the backend's `trash:restore`). It only appears when nothing depends on the record: a category with products or sub-categories, or a brand with products, shows a note saying what to move first (the API enforces the same rule). Edit forms open in place and are only built when opened, which keeps a long list light (twelve pre-built forms stopped the page from becoming interactive in testing).

## Delete buttons and suspending customers
Categories and brands show a Delete button on every row (next to Edit); it is disabled, with a note saying what to move first, while products or sub-categories still use the record. The products table has an Actions column with Delete: enabled for draft and archived products, disabled with an "Archive first" link for live ones. All deletes are soft. Admin → Customers has All / Active / Suspended filters and a Suspended badge; a customer's page has an Account status panel to suspend (optional reason, two-step confirm) or reactivate them.

## Admin sidebar on short screens
With thirteen menu items the sidebar can be taller than a laptop screen. On large screens the menu now scrolls inside the sidebar while the account name, View store and Sign out stay pinned at the bottom, so nothing is cut off; on phones the menu is a horizontal strip you can swipe.

## Live filters on listing pages
The filter form on category pages and All products (search, sort, price range, in stock) now updates the results as you change it: every key release or change writes the fields into the address (`?q=…&sort=…`) and the server re-renders the list, with empty fields left out and the page number reset. Apply and Enter still work, and without JavaScript it is an ordinary GET form.

## Admin and storefront additions
- **Trash** (`/admin/trash`), **Deletion requests** (`/admin/deletion-requests`), **Home page** (`/admin/home`), **Categories**, **Brands**, **Reviews**, **Pages** and **Newsletter** have their own sidebar items, each shown only to roles with the matching permission.
- Pages use a Markdown editor (`components/admin/rich-text-editor.tsx`) and render through `components/content/rich-text.tsx` / `lib/markdown.ts`, which never outputs raw HTML.
- Home page text, buttons, hero picture and section toggles come from `getHomepage()` in `lib/api/catalog.ts`; the announcement strip is in `site-header.tsx`.
- Favicon, app icons and the PWA manifest use the business logo through `app/brand-icon/[size]/route.ts` and `lib/brand-icon.ts` (Cloudinary resizing), falling back to the built-in icons.
- Customers can request account deletion from `/account` (`components/account/delete-account-panel.tsx`).
- Admin and storefront filter forms update live as you type (`live-filter-form.tsx`, `live-query-input.tsx`).
