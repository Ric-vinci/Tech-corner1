# Tech Corner (4gadgets rebuild) — Session Rules

Next.js 15 (App Router) + TypeScript + Tailwind rebuild of the 4gadgets ECsite:
**Buy** (used devices) + **Sell / Trade-In** (customers trade devices for cash or store credit).
Mirrors the original Magento/Hyvä UX using saved HTML snapshots in `wapple_html/`.

## Architecture — never mix these responsibilities

| System | Source of truth for |
|--------|--------------------|
| **Shopify** | Catalog only: product names, categories, collections, trade-in price metafields (`trade_in.price_*`), image URL metafield (`catalog.image_url`). Images themselves live on an external CDN, NOT in Shopify. |
| **Supabase** | Trade-in backend: `trade_in_submissions` (one row per item), `trade_in_events` (audit), `customers` (bcrypt + session cookie). RLS on; server uses service role. |
| **localStorage** | Trade-in basket (`tc3-trade-in-cart`) until checkout. |

Never store the product catalog in Supabase. Runtime catalog reads use the Storefront API,
with static JSON fallback in `src/data/` when `SHOPIFY_USE_STATIC_FALLBACK=true`.

## Buy vs Sell listing (they are NOT the same catalog view)

- **Sell** lists one row **per storage variant** with the suffixed name (`Samsung Galaxy A22 5G - A226B 64GB`)
  because a trade-in quote is storage-specific. ~250 Samsung rows.
- **Buy** lists one clean listing **per model** (`Samsung Galaxy A22 5G`), storage/colour chosen on the PDP.
- **Buy Samsung = a curated "shop window" of 47 models**, seeded from the reference into
  `src/data/generated/buy-samsung.json` (name, "From £x", CDN image). These are DIFFERENT from the sell
  catalog (they include S8/S9/S10/S20/S25/ZFold7 that aren't in our trade-in data), so the buy list is its
  own dataset — NOT derived from the sell catalog. Other brands fall back to `collapseToModels()` (strips the
  ` - <model-no> <storage>` suffix off the sell catalog and de-dupes).
- **Stock is driven by Refurb stock (Publish/Unpublish), not Pricing.** `getBuyBrandCatalogPage`
  (`src/lib/buy/catalog.ts`) fetches published units (`fetchInStockUnits`: ACTIVE `tag:trade-in` +
  `tag:"brand:<brand>"`) and shows them **FIRST and buyable** (blue cart CTA); every other curated model shows
  **"Notify when in stock"** (`CatalogProduct.inStock`, `ProductGrid` buy variant). So **publishing a refurb
  unit is the admin control for what's in stock on the storefront** — deliberately not a Pricing toggle, since
  Pricing edits trade-in quote *models* (a different concept from *units* you own).
- **One listing per model, with a stock count — never per device.** `fetchInStockUnits` collapses all ACTIVE
  refurb units of the same model into a single buyable card carrying `stockCount` (how many units we hold) and
  the union of their specs. So 3 units of one model = one card "3 in stock", not 3 cards.
- **Buying a unit removes it from stock.** `POST /api/checkout/buy` calls `markRefurbUnitsSold` (archives the
  purchased Shopify products → status ARCHIVED) for every payment method: gift_card/bank on order creation,
  paypal reserved at creation (approval window). One physical unit = one product, so a sold unit leaves the
  ACTIVE pool; when a model's **last** unit sells, its card drops out of `fetchInStockUnits` and the storefront
  shows **"Notify when in stock"**. Best-effort (never fails a persisted order); staff can re-list an archived
  unit from Refurb stock if a bank/paypal order falls through. `stockCountByModel()` (admin) counts ACTIVE units
  per model — shown as an "N in stock" badge on each Refurb stock row and each buy storefront card.
- **Filter sidebar** (`BuyFilterSidebar`) is fully interactive — all controls write URL params (`model`,
  `price_min/max`, and comma-lists `colour`/`grade`/`storage`), reset to page 1, and show removable **Active
  filtering** chips + Clear All. Colour/grade/storage narrow the **whole catalogue regardless of stock**:
  every listing carries available specs (`specsFor` in `src/lib/buy/catalog.ts` — tier-based storages +
  deterministic colours/grades so each value genuinely narrows), and a listing matches if any of its values is
  selected. In-stock units override with their real inspection `grade/colour/storage` (`fetchInStockUnits`
  joins them, best-effort/pre-006-tolerant); everything else uses representative model specs.

## Buy product detail (PDP) + buy basket

- `/buy-used/<handle>.html` → `BuyProductPage` → `getBuyProductDetail` (`src/lib/buy/product.ts`). The PDP works
  on the **model**: it resolves the model name from the handle/title (`cleanModelName`) and lists all published
  refurb **units** we hold for that model with their inspection colour/grade/storage.
- Selectors (`BuyProductDetailView`): colour (grid + swatch dot) / storage / condition-grade (4-up, price per
  grade). Three states matching the reference: **selected = blue border, available = white, unavailable = grey**.
  **Add to Basket is active only when the selected colour+storage+grade matches a real in-stock unit** (greyed
  otherwise). Selection defaults to the first in-stock unit so it's buyable immediately.
- **Colours are real per-model data** (`src/data/model-colours.ts`, `coloursForModel` — a small static
  "model info" catalogue), unioned with any in-stock unit's colour and capped at 8, so a product shows only its
  actual colours. Grade prices anchor to the real unit price and derive the rest via `GRADE_FACTOR`.
- Buy basket is separate from the trade-in basket: `src/lib/cart/buy-cart.ts` (localStorage `tc3-buy-cart`),
  `useBuyCart` hook, `BuyCartLink` header badge (normal header only; checkout uses the minimal header).
- **Buy checkout mirrors the sell flow, reusing its CSS** (`checkout.css`, `StoreShell variant="checkout"`,
  `CheckoutShippingForm` with a new `variant="buy"` that hides the trade-in-only agreements). Flow:
  `/buy-used/checkout/cart` (`BuyCartPage`) → `/buy-used/checkout` (`BuyCheckoutPage`: login-gated, address →
  payment + Place Order) → `/buy-used/checkout/success`. Order persists to **`buy_orders`** (migration
  `008_buy_orders.sql`, items inline as jsonb) via `POST /api/checkout/buy`, which **re-derives line prices from
  Shopify** (the basket is client-side). The checkout re-tints the sell-green checkout.css to **blue** under
  `.buy-used`, and `CheckoutShippingForm`/`CheckoutProgressBar` take a `variant`/`label` so the buy flow hides
  the "Trade In" button and shows a "Payment" step.
- **Buy payment rails** (`src/lib/buy-payment/`, migration `009_buy_order_payment.sql` adds
  `payment_method/status/reference/paid_at`) — customer *pays us*, method chosen in `BuyCheckoutPage`:
  **paypal** (Orders API v2: `POST /api/checkout/buy` creates the PayPal order + returns the approval URL →
  browser approves → `GET /api/checkout/buy/paypal/return` captures + marks paid), **gift_card = secure store
  credit** (`src/lib/buy-payment/store-credit.ts`): a customer's store credit is the Shopify gift cards WE
  issued them via trade-in payouts (gid stored as the submission's `payout_reference`). Looked up by the
  **authenticated `customer_id`** — never a typed code — balances summed (`getStoreCreditBalance`);
  `redeemStoreCredit` debits the customer's own cards (largest-first) via `giftCardDebit` (request only
  `userErrors` — the payload has no `giftCardTransaction` field). Two secure redemption paths:
  **(a) account balance** (by `customer_id`, unguessable) and **(b) one-time code** — a customer types a code,
  matched against the `gift_cards` registry (migration `010_gift_cards.sql`). We store an **HMAC-SHA256 of the
  code** (never plaintext, unique-indexed) written by `recordIssuedGiftCard` in the payout route at issue time;
  `redeemByCode` hashes the typed code → resolves the gid → checks the live Shopify balance → debits.
  **Only cards issued AFTER migration 010 are code-redeemable** (the plaintext code is shown once and can't be
  backfilled); older cards are still redeemable via account balance. Both sidestep Shopify's inability to
  validate a full gift-card code from a custom checkout. Closes the loop: trade in → store credit → buy. **bank** (manual: order `awaiting_payment`; staff confirm on the Orders
  screen). Reuses the payout PayPal credentials (`PAYPAL_*`).
- **Admin Orders** (`/admin/orders`, nav "Sales"): lists `buy_orders`; bank orders show **Mark as paid**
  (`PATCH /api/admin/orders/[id]` `{action:"mark_paid"}`) to confirm a received transfer.

## Remembered checkout address

The last confirmed delivery/return address is stored in **localStorage** (`tc3-checkout-address`, via
`src/lib/checkout/saved-address.ts`) — device-local, no database. On confirm, both checkouts call
`saveCheckoutAddress`; on load, `BuyCheckoutPage` / `CheckoutSecurelyPage` read it and **pre-confirm** a valid
saved address (skip straight to the payment / confirmed step). "Change Address" still works as normal and
re-saves. No DB column, no migration — deliberately not tied to the account.

## Header mega-menu

The buy header's hover mega-menu (brand columns + model lists under Mobile Phones / Tablets / Smart Watches) is
pure-CSS on desktop (vendor `.navigation__item--parent:hover` rules). Its **content comes from `columns`** on
each `NavItem`. Shopify menus are **flat** (top-level only), so a Shopify-driven nav has no columns and nothing
shows on hover — `getNavForStore` (`src/lib/shopify/navigation.ts`) therefore **enriches** the Shopify nav with
the static `megaNav` columns matched by label. Shopify still owns the top-level items/order; the static data
just fills the dropdown. If you rename a top-level item in Shopify, update the matching label in
`src/data/navigation.ts` or its columns won't attach.

## Store modes

- `StoreShell` wraps every page with `.buy-used` or `.sell-my` on `.page-wrapper`.
- `StoreShell variant="checkout"` renders the minimal header (logo + Continue Shopping, no nav/USP)
  — used by the basket, checkout and success pages, matching the reference HTML.
- Accent color: buy = blue, sell = green `#1eb16d`. Sell checkout CSS targets `.sell-my`.
- `/` = buy home; `/sell` redirects to `/sell-my`; buy-side account routes redirect to sell-side.

## Development rules

1. **Minimize scope** — smallest correct diff; don't refactor unrelated code.
2. **Match existing conventions** — naming, imports, component patterns of surrounding files.
3. **Shopify = catalog, Supabase = trade-ins** — never mix.
4. **`wapple_html/` is a read-only visual/DOM reference** — never served at runtime; implement
   behaviour in React/TSX + `src/styles/checkout.css`. Match class names, layout, button colours.
5. **Checkout buttons are separate** — “Confirm Address” (validates address, advances step) ≠
   “Trade In” (submits basket). Trade In is disabled (pale mint `#b8e6d0`) until terms +
   recycling are checked, then strong green `#1eb16d`.
6. **Checkout submits ALL basket items** — `POST /api/checkout/trade-in` loops every cart item,
   one `trade_in_submissions` row each.
7. **Customer login required for checkout** (`returnUrl` redirect); admin session is separate
   from customer session.
8. **Status workflow is constrained** — only transitions allowed in
   `TRADE_IN_STATUS_TRANSITIONS` (`src/lib/trade-in/status.ts`):
   `submitted → awaiting_shipment → in_transit → received → under_inspection →
   accepted | revised_offer | rejected → paid → closed`.
   On `accepted`, a draft Shopify inventory product is created.
9. **Never commit secrets** — `.env.local`, service role keys, session secrets.
10. **Supabase migrations are ordered** (001→004 in `supabase/migrations/`); add new ones as
    the next number, never edit applied ones.

## Key paths

- Checkout: `src/components/checkout/*`, orchestrated by
  `src/components/customer/CheckoutSecurelyPage.tsx`; reference HTML in
  `wapple_html/sell/check-out/addbasket/step3*/`.
- Shopify clients/mappers: `src/lib/shopify/` · Supabase server client: `src/lib/supabase/`.
- Cart: `src/components/cart/CartProvider.tsx` + `src/lib/cart/trade-in-cart.ts`.
- Admin dashboard: `/admin/login` → `/admin/trade-ins` (env `ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- Catalog sync scripts: `npm run sync:shopify`, `publish:shopify`, `fetch:samsung`, etc.

## Emails

`src/lib/email/` — nodemailer, gated on `SMTP_*`. When unconfigured, `sendMail` logs and returns
false rather than throwing: **email delivery must never fail a persisted trade-in or admin action.**
The customer is emailed on checkout (confirmation + shipping) and on every meaningful status change:
`awaiting_shipment` (return pack), `received`, `revised_offer`, `rejected`, `accepted`, `paid`.
The `paid` email is sent by the payout route (it alone knows the gift-card code); the status route
suppresses it when a payout reference already exists to avoid a duplicate.

## Admin

- The admin is a **pipeline**. `AdminNav` (client, active-state) groups pages: **Overview** (Dashboard) ·
  **Pipeline** (numbered 1–5: Trade-In Queue → Inspection Queue → Refurbishment Queue → Ready for Sale →
  Live on Store) · **Catalog** (Pricing) · **System** (Customers, Reports, Settings). Login renders bare.
- **Queues are filtered views** of `trade_in_submissions` by status group (`src/lib/admin/pipeline.ts`):
  trade-in = submitted/awaiting_shipment/in_transit · inspection = received/under_inspection/revised_offer ·
  refurbishment = accepted/paid. "Ready for Sale"/"Live on Store" are `/admin/inventory` filtered to draft/live.
  The trade-ins page takes `?queue=<slug>` (and `?status=` narrows within it).
- **Dashboard** (`/admin`) = KPI cards + pipeline stage counts + recent submissions. **Reports** = accept rate,
  6-month volume, status breakdown. **Settings** = integration health (env presence) + business rules (read-only).
- **Inspection capture** (migration `006_inspection_details.sql`): staff enter grade / battery_health / colour /
  storage / imei / inspection_photos on the trade-in detail (`InspectionCard`). Defaults are pre-filled —
  storage parsed from the product name, grade from condition, **photos default to the catalogue model image**
  (`getModelImageUrl`, resolved via the accept step's `sourceProductMeta`). Saved via PATCH `inspection:{…}`,
  stamped `inspected_at`/`inspected_by`. `PipelineStepper` on the detail page shows the device's position.
- Sidebar shell (`AdminShell`).
- **Team / multiple admins** (`/admin/team`, nav "Team" under System; migration `011_admin_users.sql`). The
  env `ADMIN_EMAIL`/`ADMIN_PASSWORD` is still the built-in **owner** (not in the DB); extra admins live in
  `admin_users` (`src/lib/admin/admins.ts`). An admin invites a teammate by email (`POST /api/admin/admins`) →
  a random invite token is **HMAC-stored** (never plaintext, `hashInviteToken`, 3-day expiry) and emailed
  (`sendAdminInviteEmail`; the invite URL is also returned so it works when SMTP is off). The invitee opens
  `/admin/invite/accept?email=&token=`, sets a password (`acceptAdminInvite`, scrypt via the shared
  `hashPassword`), which marks them `active` and logs them in. **Login** (`/api/admin/login`) accepts the env
  owner OR any active `admin_users` row (`verifyAdminCredentials`). The **session token** is HMAC-signed at
  login for whatever email was authorized — `verifyAdminSessionToken` no longer hard-codes the owner email, so
  every admin's session validates (a revoked admin's existing cookie lasts until its ≤7-day expiry). Remove/cancel
  via `DELETE /api/admin/admins/[id]`.
- Trade-in detail has **Quick actions** (`QuickStatusActions`): one-click status advance, filtered to
  legal transitions, with a `window.confirm` on the consequential ones (accept, reject, close).
  Payout is never a bare status flip — it goes through the payout panel.
- **Pricing** (`/admin/pricing`): edits **catalogue models** — the `trade_in.price_working|faulty|no_power`
  metafields straight in Shopify (`src/lib/shopify/admin-pricing.ts`, `metafieldsSet`, `number_decimal`).
  Cursor-paginated, search, "set all Working on this page". Blank/negative cells are left untouched.
- **Refurb stock** (`/admin/inventory`): the **physical units** you own — one row per accepted
  trade-in (Shopify products tagged `trade-in`), joined to the source submission for grade + what you
  paid. Set a resale price (variant price) and Publish/Unpublish. Publish = ACTIVE + published to all
  channels, so the Storefront API returns it; accepted units are DRAFT until a staff member publishes.
  `src/lib/shopify/admin-inventory.ts`.
- **Model vs unit:** Pricing edits models (a template + trade-in quote); Refurb stock lists individual
  units (a specific graded device with a cost + resale price). Don't conflate them.
- Product photos come from the `catalog.image_url` metafield, resolved through `resolveImageUrl` —
  private-S3 URLs must be rewritten to the public fallback or they 404. The accept step copies the
  model's image_url + category/brand tags onto the new refurb product (photo + category filtering).
- **Admin Shopify reads must be fresh:** `adminRequest(query, vars, { noStore: true })`. The default
  is `revalidate: 3600` (good for the public catalogue) — but on an admin screen that caches a stale
  status after a publish/price change. Pass `noStore` from every admin list read and mutation.
- Refurb resale price defaults to `refurbDefaultResalePrice(cost)` = `max(cost×1.30, cost+£10)` on
  accept (env `REFURB_DEFAULT_MARKUP_PCT`/`_GBP`), so units never list at zero margin.
- **Category filtering spans the admin** (5 categories, matching the customer site). Pricing + Refurb filter
  by Shopify `category:*` tag; **trade-in queues** filter by `trade_in_submissions.category` (migration
  `007_submission_category.sql`, captured at checkout via `categoryFromSellHref(item.productHref)`, existing
  rows backfilled to `mobile`). `TradeInList` renders the category pill row (preserves queue + status).
- Both Pricing and Refurb screens filter by the 5 categories (`ADMIN_CATEGORIES`, tag `category:*`) +
  search + cursor pagination via `AdminFilterBar` — plain GET links, no client state, scales to 1000s.
  **Tag values with a colon must be quoted in Shopify search** — `tag:"category:mobile"`, not
  `tag:category:mobile` (the latter matches nothing). Same for any `brand:*` filter.
- Refurb stat cards (live/draft) are client state in `RefurbInventoryTable`, adjusted on publish/
  unpublish so they update without a page refresh; the total comes from `countRefurbUnits`.
- New products take ~10s to appear in Shopify `tag:` search (eventual consistency); a just-accepted
  unit shows in Refurb stock on the next refresh, not instantly.

## Payouts — money moves here, be careful

`src/lib/payout/` — one interface, three rails, picked from `payment_method`:
**gift_card** (Shopify `giftCardCreate`, store currency = GBP), **bank** (manual: staff pay from
their banking app, then record the reference; batch CSV at `/api/admin/trade-in/export`),
**paypal** (Payouts API, `sender_batch_id` = submission uuid).

Non-negotiable rules:
1. **Double-pay is blocked at three layers** — the API refuses when `payout_reference` is set or
   `payout_status = 'processing'`; a partial unique index on `payout_reference` enforces it in
   Postgres; PayPal rejects a replayed `sender_batch_id`. Never weaken any of these.
2. **Never take the amount from the client.** The basket is localStorage, so every price in a
   checkout request is attacker-controlled. `src/lib/trade-in/pricing.ts` re-derives the quote from
   Shopify metafields (`trade_in.price_working|faulty|no_power`) by slug + condition, then adds the
   store-credit bonus. Payouts use `revised_price ?? quoted_price`, server-side.
   The **store-credit bonus** (`NEXT_PUBLIC_TRADE_IN_STORE_CREDIT_BONUS`, default £15) is added at
   checkout only — per spec it is never shown on the product detail page.
3. **Record intent before calling the provider** (`payout_status='processing'`), so a crash can't
   hide that money may have moved.
4. **`status` only advances to `paid` when the payout actually settles.** PayPal is asynchronous —
   a 201 means accepted. Unsettled payouts resolve via `POST .../payout/reconcile`.
5. **Outside `PAYPAL_ENV=live`**, `PAYPAL_SANDBOX_RECEIVER_EMAIL` redirects every payout, so a test
   can never pay a real customer.
   `/api/webhooks/paypal` settles payouts automatically. It is a public URL, so the PayPal
   signature is verified (`PAYPAL_WEBHOOK_ID`) **before** touching the DB — otherwise anyone could
   mark trade-ins as paid. Handlers are idempotent (webhooks are at-least-once).
6. Gift card codes are revealed **once** by Shopify — emailed, never persisted (only the gid is).

## Accepted trade-ins are DRAFT on purpose

On `accepted`, `src/lib/trade-in/shopify-inventory.ts` creates the Shopify product with
`status: "DRAFT"` and no sales-channel publication. **The Storefront API therefore returns `null`
for it — that is expected, not a bug.** A just-accepted device has no photos, description, or grade,
so staff publish it manually in Shopify Admin (set ACTIVE + publish to a channel) once the listing
is ready. The product is created *after* the DB status write, and `productSet` is keyed on a
deterministic handle, so retries update rather than duplicate.

## Known gaps (don't treat as bugs)

- Fetchify address lookup is UI-only (manual entry works).
- Buy-side pricing from Shopify variant price not fully wired.
- `src/lib/shopify/admin-catalog.ts` has pre-existing implicit-any warnings.
- SMS consent phone field + full minicart sidebar not yet matched to reference.
