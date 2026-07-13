# Tech Corner — 4gadgets storefront (Next.js)

Frontend rebuild of the **4gadgets** e-commerce site (Buy used devices + Sell / Trade-in) in **Next.js 15 (App Router) + TypeScript + Tailwind CSS**.

The app mirrors the original Magento/Hyvä storefront UX using saved HTML references in `wapple_html/`. Production data is split across **Shopify** (catalog), **Supabase** (trade-ins, customers, workflow), and **browser localStorage** (trade-in basket).

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in credentials (see Environment)
npm run dev                  # http://localhost:3000
npm run build && npm run start
```

Apply Supabase migrations (in order):

```bash
npm run supabase:migrate
# or run each file manually in the Supabase SQL editor:
# 001 → 002 → 003 → 004
```

---

## Architecture overview

| System | Role | What lives here |
|--------|------|-----------------|
| **Shopify** | Catalog only | Product names, categories, trade-in prices, image URL metafields |
| **Supabase** | Trade-in backend | Submissions, workflow status, events, customer accounts |
| **localStorage** | Client basket | Trade-in cart (`tc3-trade-in-cart`) until checkout |
| **Next.js** | UI + API routes | Pages, forms, admin dashboard, Shopify/Supabase integration |

**Rule:** Shopify is the source of truth for **what** can be traded in and **how much** it quotes. Supabase is the source of truth for **who** submitted, **shipping**, **payout details**, and **workflow state**. Never store the product catalog in Supabase.

```
Customer journey (sell side)
────────────────────────────
Browse catalog (Shopify) → Product detail → Add to basket (localStorage)
  → Cart → Login (Supabase customers) → Checkout (address + agreements)
  → POST /api/checkout/trade-in → Supabase trade_in_submissions (one row per item)
  → Admin reviews → status workflow → optional Shopify inventory product on accept
```

---

## Environment variables

Copy `.env.example` → `.env.local`. Never commit `.env.local`.

### Shopify

| Variable | Purpose |
|----------|---------|
| `SHOPIFY_STORE_DOMAIN` | Store domain (`your-store.myshopify.com`) |
| `SHOPIFY_API_VERSION` | API version (default `2026-01`) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Admin API — sync scripts, inventory on accept |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Storefront API — runtime catalog reads |
| `SHOPIFY_USE_STATIC_FALLBACK` | `false` in production when Shopify is configured |
| `SHOPIFY_WEBHOOK_SECRET` | HMAC verification for `/api/webhooks/shopify` |
| `IMAGE_CDN_BASE_URL` | External CDN for product images (not stored in Shopify) |
| `IMAGE_CDN_PUBLIC` | Whether CDN allows public reads |
| `IMAGE_FALLBACK_ORIGIN` | Fallback image host (default `https://www.4gadgets.co.uk`) |

### Supabase

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only — bypasses RLS |
| `SUPABASE_DB_URL` | Optional — for `npm run supabase:migrate` |

### Email (optional)

When SMTP is unset, emails are **skipped and logged** — a trade-in never fails because mail isn't configured.

| Variable | Purpose |
|----------|---------|
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | SMTP transport (port `465` ⇒ TLS) |
| `SMTP_FROM` | From header (defaults to `SMTP_USER`) |
| `TRADE_IN_SHIPPING_INSTRUCTIONS` | Overrides the default instructions; supports `{{submissionId}}` |

Emails sent: **confirmation + shipping instructions** on checkout, **accepted** and **paid** on the
matching admin status changes (`src/lib/email/trade-in.ts`).

### Auth

| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAIL` | Admin login email (default `ricpadua556@gmail.com`) |
| `ADMIN_PASSWORD` | Admin login password |
| `ADMIN_SESSION_SECRET` | Signs admin session cookie |
| `CUSTOMER_SESSION_SECRET` | Optional — signs customer session (falls back to admin secret) |

---

## Routes

### Buy side (`buy-used` wrapper class)

| Route | Page |
|-------|------|
| `/` | Buy homepage |
| `/buy-used` | Buy homepage (alias) |
| `/buy-used/[...slug]` | Collections & products |

### Sell / Trade-in side (`sell-my` wrapper class)

| Route | Page |
|-------|------|
| `/sell-my` | Sell homepage |
| `/sell` | Redirects to `/sell-my` |
| `/sell-my/mobile` | Mobile brand picker |
| `/sell-my/mobile/[brand]` | Brand trade-in listing |
| `/sell-my/mobile/[brand]/[family]` | Model family listing |
| `/sell-my/tablets` | Tablet trade-in |
| `/sell-my/games-consoles` | Console trade-in |
| `/sell-my/sell-my-watch` | Smartwatch trade-in |
| `/sell-my/sell-my-camera` | Camera trade-in |
| `/sell-my/[slug]` | Trade-in product detail + form |
| `/sell-my/checkout/cart` | Trade-in basket |
| `/sell-my/checkout` | Checkout securely (address → confirm → trade in) |
| `/sell-my/checkout/onepage/success` | Post-checkout success |
| `/sell-my/customer/account` | Customer dashboard |
| `/sell-my/customer/account/login` | Customer login |
| `/sell-my/customer/account/create` | Customer registration |
| `/sell-my/customer/account/edit` | Edit profile |
| `/sell-my/sales/order/history` | Customer trade-in history |

### Admin

| Route | Page |
|-------|------|
| `/admin/login` | Admin login |
| `/admin/trade-ins` | Trade-in submission list |
| `/admin/trade-ins/[id]` | Submission detail + status updates |

### API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trade-in` | POST | Single product form submit (legacy / direct) |
| `/api/checkout/trade-in` | POST | Multi-item checkout submit (requires customer session) |
| `/api/customer/login` | POST | Customer login |
| `/api/customer/register` | POST | Customer registration |
| `/api/customer/me` | GET | Current customer session |
| `/api/customer/profile` | PATCH | Update customer profile |
| `/api/customer/trade-ins` | GET | Customer's trade-in submissions |
| `/api/admin/login` | POST | Admin login |
| `/api/admin/logout` | POST | Admin logout |
| `/api/admin/trade-in` | GET | List submissions (admin) |
| `/api/admin/trade-in/[id]` | GET/PATCH | Detail + status update |
| `/api/webhooks/shopify` | POST | Catalog revalidation webhooks |

---

## Sell checkout flow

Checkout is implemented at `/sell-my/checkout` and must match the reference HTML in `wapple_html/sell/check-out/addbasket/`.

### Prerequisites

1. Customer must be **logged in** (`/sell-my/customer/account/login?returnUrl=/sell-my/checkout`)
2. Trade-in **cart must not be empty** (redirects to `/sell-my/checkout/cart`)

### Step 1 — Address form

**Reference:** `wapple_html/sell/check-out/addbasket/step3/Checkout.html`

| UI element | Behaviour |
|------------|-----------|
| White card | Address fields: name, company, address search, manual entry, phone (UK `iti` flag) |
| **Confirm Address** (inside card, green) | Validates address → advances to step 2 |
| 4 checkboxes (below card) | Newsletter, SMS, terms*, recycling* |
| **Trade In** (bottom, pale mint) | Always **disabled** on this step — does not submit |

**Component:** `src/components/checkout/CheckoutShippingForm.tsx`  
**Styles:** `src/styles/checkout.css`

### Step 2 — Confirmed address

**Reference:** `wapple_html/sell/check-out/addbasket/step3-confirmedadress/Checkout.html`

| UI element | Behaviour |
|------------|-----------|
| White card | **Your Address** block + green **Change Address** button |
| 4 checkboxes | Same as step 1 (state persists) |
| **Trade In** (bottom) | Pale mint when disabled; **strong green** (`#1eb16d`) when terms + recycling checked |
| Submit | `POST /api/checkout/trade-in` with **all** basket items + `shippingAddress` |

**Component:** `src/components/checkout/CheckoutConfirmedAddress.tsx`

### Sidebar (right column)

Lists **every** cart item, product name in bold (matches the reference):

```
Trade In - Samsung Galaxy A22 5G ×3
Trade In - iPhone 11 64GB
The payment will be processed once we've received your device.
```

**Component:** `src/components/checkout/CheckoutOrderSummary.tsx`

### Checkout orchestration

**Component:** `src/components/customer/CheckoutSecurelyPage.tsx`

- Steps: `address` | `confirmed`
- Agreement state lifted to parent (shared across steps)
- `handleTradeIn` only runs on `confirmed` step when `requiredAgreementsChecked` (terms + recycling)

### Checkout API (`POST /api/checkout/trade-in`)

- Requires customer session cookie
- Accepts `{ items: TradeInCartItem[], shippingAddress }`
- Creates **one** `trade_in_submissions` row per cart item (loop)
- Updates customer `first_name`, `last_name`, `phone`
- Stores `shipping_address`, `customer_phone` on each submission
- Logs `trade_in_events` with `event_type: submitted`
- Returns `{ submissionIds: string[] }` → redirect to success page

---

## Trade-in cart (localStorage)

| Key | Value |
|-----|-------|
| Storage key | `tc3-trade-in-cart` |
| Provider | `src/components/cart/CartProvider.tsx` |
| Types | `src/lib/cart/trade-in-cart.ts` |

Each cart item includes: product info, Shopify IDs, condition, return pack, payment method, quantity, unit price, IMEI, payout details, confirmation flags.

---

## Trade-in workflow (Supabase)

### Statuses

```
submitted → awaiting_shipment → in_transit → received → under_inspection
  → accepted | revised_offer | rejected → paid → closed
```

Defined in `src/lib/trade-in/status.ts`. Admin can only transition along allowed paths (`TRADE_IN_STATUS_TRANSITIONS`).

### Database tables

| Table | Purpose |
|-------|---------|
| `trade_in_submissions` | One row per trade-in (product, condition, price, customer, shipping, status) |
| `trade_in_events` | Audit log per submission (status changes, notes) |
| `customers` | Sell-side accounts (email + password hash) |

### Migrations (apply in order)

| File | Adds |
|------|------|
| `001_trade_in_submissions.sql` | Core submissions + events tables |
| `002_trade_in_workflow.sql` | Revised price, admin notes, tracking, inventory link |
| `003_customers.sql` | Customer accounts + `customer_id` FK |
| `004_trade_in_shipping.sql` | `shipping_address` jsonb, `customer_phone` |
| `005_payouts.sql` | `payout_provider/status/error/amount/message`, `paid_at`, unique index on `payout_reference` |

RLS is enabled; the app uses **service role** on the server. Anon clients cannot read submissions.

### Admin dashboard

- Login: `/admin/login` (credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- List/filter by status at `/admin/trade-ins`
- Detail page: view submission (incl. phone + shipping address), update status, add notes
- On **accepted** status: creates a **DRAFT** Shopify inventory product
  (`src/lib/trade-in/shopify-inventory.ts`) and links its id back to the submission.

> The product is intentionally `DRAFT` with no sales-channel publication, so the **Storefront API
> will not return it**. Publish it manually in Shopify Admin (set ACTIVE + publish to a channel)
> after adding photos/description. Inventory is created *after* the status is persisted, so a DB
> failure can never orphan a Shopify product.

---

## Shopify catalog

Product **names**, **categories**, and **trade-in prices** live in Shopify.  
**Images are not stored in Shopify** — only an external URL in the `catalog.image_url` metafield.

### Sync commands

```bash
npm run fetch:samsung      # optional: refresh local JSON from 4gadgets
npm run import:samsung       # optional: merge local image paths
npm run sync:shopify         # push collections + products to Shopify
npm run publish:shopify      # publish collections + products
npm run assets:manifest      # list S3 upload paths for brand logos / heroes
```

### What sync creates

| Shopify resource | Purpose |
|------------------|---------|
| Collections `mobile-phones`, `tablets`, … | Top-level categories |
| Collections `samsung-mobile`, `apple-mobile`, … | Brand catalogs |
| Products | One per device SKU |
| `catalog.image_url` metafield | External CDN image URL |
| `trade_in.price_*` metafields | Working / faulty / no-power quotes |

Runtime reads use **Storefront API** when configured; falls back to static JSON in `src/data/` when `SHOPIFY_USE_STATIC_FALLBACK=true`.

Key lib files:

- `src/lib/shopify/catalog.ts` — product fetching
- `src/lib/shopify/collections.ts` — collection fetching
- `src/lib/shopify/mappers.ts` — Shopify → app types
- `src/lib/shopify/config.ts` — env + fallback logic

---

## Project structure

```
src/
  app/
    sell-my/                  # Sell / trade-in pages
      checkout/               # Cart + checkout + success
      customer/               # Account, login, register
      mobile/                 # Brand & family listings
      sales/                  # Order history
    buy-used/                 # Buy-side pages
    admin/                    # Admin dashboard
    api/                      # Route handlers (trade-in, customer, admin, webhooks)
  components/
    checkout/                 # CheckoutShippingForm, CheckoutConfirmedAddress, etc.
    cart/                     # CartProvider, TradeInCartPage, drawer
    catalog/                  # Product grids, detail, breadcrumbs
    customer/                 # Login, register, CheckoutSecurelyPage
    admin/                    # TradeInList, TradeInDetail
    layout/                   # Header, Footer, StoreShell (sell-my / buy-used class)
    sell/ buy/ pages/ ui/     # Homepage sections & composed pages
  lib/
    shopify/                  # Storefront + Admin API clients
    supabase/                 # Server Supabase client
    trade-in/                 # Status workflow, types, Shopify inventory
    cart/                     # Trade-in cart types + localStorage helpers
    checkout/                 # Shipping address validation
    customer/                 # Session, password, require-account
    admin/                    # Admin session + config
  data/                       # Static catalog fallback, navigation, content
  styles/
    checkout.css              # Checkout-specific styles (matches wapple_html)
    vendor/styles.css         # Compiled Tailwind / theme
    images/                   # Icons, content images for CSS
supabase/migrations/          # SQL migrations (001–004)
wapple_html/                  # Original HTML snapshots (NOT served at runtime)
scripts/                      # Catalog sync, migration runner
public/images/                # Static assets
```

---

## UI / styling conventions

### Store modes

`StoreShell` wraps every page with either `sell-my` or `buy-used` on `.page-wrapper`. Sell checkout CSS targets `.sell-my` for green accents (`#1eb16d`).

### Reference HTML (`wapple_html/`)

Use saved HTML as the **visual and DOM reference** when building sell checkout and other Magento-migrated pages. Key checkout references:

| Path | State |
|------|-------|
| `wapple_html/sell/check-out/addbasket/step3/` | Address form + Confirm Address inside card |
| `wapple_html/sell/check-out/addbasket/step3-confirmedadress/` | Confirmed address + Trade In |

Match: class names, layout (66% `.opc-wrapper` / 33% `.opc-sidebar` as siblings, so the sidebar aligns with the top of the progress bar), progress bar, white card shadow, button colours, agreements + Trade In in normal flow below the card.

### Checkout CSS rules

- **Confirm Address** — inside white card, full width, green `#1eb16d`
- **Trade In (idle)** — pale mint `#b8e6d0`, white text, disabled
- **Trade In (active)** — strong green `#1eb16d`
- **Change Address** — compact green primary button inside address card
- **Phone link** — blue `#006bb4`
- **Progress bar** — only “Trade-In” label visible on step 3; green active segment

### Development rules

1. **Minimize scope** — smallest correct diff; don't refactor unrelated code
2. **Match existing conventions** — naming, imports, component patterns in surrounding files
3. **Shopify = catalog, Supabase = trade-ins** — never mix responsibilities
4. **Checkout buttons are separate** — Confirm Address (address only) ≠ Trade In (submit basket)
5. **Submit all basket items** — checkout API loops every cart item, even when count > 2
6. **Customer login required** for checkout; admin session separate from customer session
7. **Don't commit secrets** — `.env.local`, service role keys, session secrets
8. **wapple_html is read-only reference** — implement behaviour in React/TSX + `checkout.css`

---

## Customer authentication

- Registration: `POST /api/customer/register` → Supabase `customers` table (bcrypt password)
- Login: `POST /api/customer/login` → signed HTTP-only session cookie
- Session: `src/lib/customer/session.ts` + `session-token.ts`
- Protected pages use `requireCustomerAccount()` → redirect to login with `returnUrl`

Buy-side account routes redirect to sell-side (`/buy-used/customer/account` → `/sell-my/customer/account`).

---

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | Next.js ESLint |
| `npm run fetch:samsung` | Fetch Samsung models from 4gadgets |
| `npm run import:samsung` | Import Samsung catalog JSON |
| `npm run sync:shopify` | Push catalog to Shopify |
| `npm run publish:shopify` | Publish Shopify collections/products |
| `npm run assets:manifest` | Generate asset upload manifest |
| `npm run supabase:migrate` | Apply SQL migrations |

---

## Testing checkout locally

1. `npm run dev` → `http://localhost:3000`
2. Add one or more devices to the trade-in cart from a product page
3. Go to `/sell-my/checkout/cart` → proceed to checkout
4. Log in if prompted
5. Fill address → **Confirm Address**
6. Verify confirmed view matches `step3-confirmedadress` reference
7. Check terms + recycling → **Trade In** turns green → submit
8. Verify rows in Supabase `trade_in_submissions` (one per item)

Admin review: `/admin/login` → `/admin/trade-ins`

---

## Still to wire / known gaps

- Fetchify address lookup (search field is UI-only; manual entry works)
- Buy pages — full Shopify buy pricing from variant price
- `src/lib/shopify/admin-catalog.ts` — pre-existing TypeScript implicit-any warnings
- SMS consent phone field (hidden in reference unless SMS checkbox checked)
- Full `items-in-cart` sidebar with product images (reference has minicart block; app uses `opc-help-cms` text list)

---

## License

Private — 4gadgets / Tech Corner rebuild.
