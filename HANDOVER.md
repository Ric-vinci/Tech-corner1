# Tech Corner — Handover / Go-Live Checklist

Moving the project onto the client's own accounts. Work top to bottom: later
steps depend on earlier ones.

**Legend:** 🧑‍💼 client does it · 👨‍💻 developer does it · ⚠️ easy to get wrong

---

## Current state (verified 2026-07-21)

| Thing | Where it is now |
|---|---|
| Shopify (client's live store) | `tech-corner-9576.myshopify.com` (also answers to `8kttre-zn`) → www.tech-corner.co.uk |
| Shopify (dev store) | `tech-corner-dripetja.myshopify.com` — ours, to be retired |
| Supabase | ✅ already transferred to the client's organisation |
| GitHub | `Ric-vinci/Tech-corner1` — still ours |
| Vercel | `tech-corner1.vercel.app` — still ours |
| Domain | www.tech-corner.co.uk points at **Shopify**, not Vercel |
| PayPal | Sandbox only |

The site currently serves its 555-product sell catalogue from JSON files in the
repo (`SHOPIFY_USE_STATIC_FALLBACK=true`), **not** live from Shopify. Keep it
that way through the move — it means switching stores can't empty the catalogue.

---

## 1. Shopify — connect to the client's store

👨‍💻 Access is done. What remains is the API connection.

1. 🧑‍💼 **Owner only:** Settings → Apps and sales channels → Develop apps →
   **Allow custom app development**. Staff cannot do this, even with full permissions.
2. 🧑‍💼 Settings → Users → developer's account → tick **Manage and install apps**
   (plus Products and Orders).
3. 👨‍💻 Settings → Apps and sales channels → **Develop apps → Create an app**.
4. 👨‍💻 Configure **Admin API scopes**:
   - `read_products`, `write_products`
   - `read_inventory`, `write_inventory`
   - `read_publications`, `write_publications`
   - `read_gift_cards`, `write_gift_cards`
   - `read_orders`
5. 👨‍💻 **Install app**, then copy:
   - **Admin API access token** (`shpat_…`) — ⚠️ shown once only
   - **Storefront API token** (separate tab)
6. 👨‍💻 Verify both work:
   ```bash
   curl -s "https://tech-corner-9576.myshopify.com/admin/api/2026-01/shop.json" \
     -H "X-Shopify-Access-Token: shpat_…"
   ```
   Returns the shop details → correct.

⚠️ **The catalogue does not come with the token.** Trade-in prices
(`trade_in.price_*` metafields), `brand:`/`category:` tags and refurb units live
in the old dev store. The client's store starts empty of them. Either rebuild
them there, or stay on the static fallback (recommended for launch).

---

## 2. Supabase — finish the transfer

✅ Project already moved to the client's organisation.

1. 🧑‍💼 Organisation → Team → invite the developer as **Administrator**.
2. 👨‍💻 Run the outstanding migration in SQL Editor:
   **`supabase/migrations/012_buy_order_stock.sql`** — 001→011 are already applied.
3. 👨‍💻 Settings → API → copy the **Project URL** and **service_role key**.

⚠️ **Do not create a fresh Supabase project.** All 555 product images are stored
in this one (`product-images` bucket) and the catalogue JSON hard-codes their
URLs. A new project breaks every image on the site.

⚠️ The database still holds test data (6 trade-ins, 7 customers, 2 admin
accounts). Decide: keep as demo, or clear before launch. Either way, **remove the
developer's admin accounts** once the client has their own.

---

## 3. GitHub

1. 🧑‍💼 Create a GitHub account, then a free **Organization** (better than a
   personal repo for a business — survives staff changes).
2. 👨‍💻 Repo → Settings → Danger Zone → **Transfer ownership** → the client's org.
3. 🧑‍💼 Org → People → invite the developer as **Member (Write access)**.

---

## 4. Vercel

⚠️ **Vercel's free (Hobby) plan cannot add team members at all**, and is
personal-use-only. The client needs a **Pro team (~$20/month per member)**.

Cleanest route is a fresh deploy under the client's account, not a transfer:

1. 🧑‍💼 Create a Vercel account (sign in with GitHub) and a **Team** on Pro.
2. 🧑‍💼 Team → Settings → Members → invite the developer.
3. 👨‍💻 **Add New Project** → import the repo from the client's GitHub org.
4. 👨‍💻 Add every environment variable (section 5) **before** the first deploy.
5. 👨‍💻 Deploy, then check the site loads and the admin login works.
6. 👨‍💻 Delete the old `tech-corner1` project once the new one is confirmed good.

---

## 5. Environment variables

Copy `.env.example` and fill it in. ⚠️ **Never send these by email or chat** —
use a password manager. The Supabase service-role key bypasses all database
security.

### Generate fresh — do not reuse the developer's

```bash
openssl rand -base64 32   # run separately for each
```

| Variable | Note |
|---|---|
| `ADMIN_SESSION_SECRET` | |
| `CUSTOMER_SESSION_SECRET` | Falls back to the admin secret if unset — set it properly |
| `GIFT_CARD_HASH_SECRET` | ⚠️ Set **before** launch. Changing it later makes issued gift-card codes unredeemable |
| `CRON_SECRET` | Authorises the scheduled stock-release job |
| `ADMIN_PASSWORD` | Client picks their own |

### Must be corrected

| Variable | Set to |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | ⚠️ The real URL. Currently `http://localhost:3000` — **admin invite emails are broken until this is fixed** |
| `SHOPIFY_STORE_DOMAIN` | `tech-corner-9576.myshopify.com` |
| `SHOPIFY_USE_STATIC_FALLBACK` | Keep `true` for launch |
| `IMAGE_CDN_BASE_URL` | **Delete this line** — points at a deleted AWS bucket |
| `PAYPAL_ENV` | `sandbox` until live payments are ready |

---

## 6. Domain

⚠️ www.tech-corner.co.uk currently serves the **Shopify** storefront. Pointing it
at Vercel takes that shop offline. That is the correct end state — in this
architecture Shopify is only a catalogue backend and the Next.js app is the real
shop — but it must be a deliberate decision, not an accident.

**Recommended: test on a subdomain first, switch the main domain when happy.**

1. 👨‍💻 Vercel → Project → Settings → Domains → Add → `shop.tech-corner.co.uk`
2. 🧑‍💼 At the domain registrar, add the DNS record Vercel displays
   (use the values **Vercel shows you** — they change over time)
3. Wait a few minutes; HTTPS is issued automatically
4. 👨‍💻 Set `NEXT_PUBLIC_SITE_URL=https://shop.tech-corner.co.uk` and redeploy

When ready to go fully live, repeat for the apex domain and remove it from Shopify.

---

## 7. Payments — before taking real money

1. 🧑‍💼 Create a **PayPal Business** account.
2. 🧑‍💼 developer.paypal.com → create a **Live** app → share Client ID + Secret
   securely.
3. 🧑‍💼 Add a webhook pointing to `https://<domain>/api/webhooks/paypal`,
   subscribed to payment capture + payout events → share the **Webhook ID**.
4. 👨‍💻 Set `PAYPAL_ENV=live`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
   `PAYPAL_WEBHOOK_ID`.
5. 🧑‍💼 Provide bank details for `BUY_BANK_ACCOUNT_NAME` / `_SORT_CODE` /
   `_ACCOUNT_NUMBER`.
6. 👨‍💻 In Vercel, add `CRON_SECRET` so the scheduled stock-release job can run.

⚠️ Without `PAYPAL_WEBHOOK_ID`, payouts never settle automatically. It fails
safely (rejects everything rather than trusting fakes), but it does nothing until set.

⚠️ Vercel's Hobby plan only allows **daily** cron jobs. `vercel.json` requests
hourly — if the deploy complains, change the schedule to `"0 3 * * *"`.

---

## 8. Email

1. 🧑‍💼 Create a **Brevo** account (or transfer the existing one).
2. 🧑‍💼 Settings → SMTP & API → share the SMTP key securely.
3. 👨‍💻 Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.

If unset, emails are skipped and logged rather than sent — a trade-in is never
lost because email failed.

---

## 9. Final checks before launch

- [ ] Migration 012 applied
- [ ] `NEXT_PUBLIC_SITE_URL` is the real domain
- [ ] All five secrets regenerated (not the developer's)
- [ ] Admin login works with the client's own password
- [ ] Developer's old admin accounts removed from `admin_users`
- [ ] Test data cleared or accepted as demo
- [ ] One end-to-end trade-in: submit → accept → publish → appears on storefront
- [ ] One end-to-end purchase in PayPal **sandbox** before switching to live
- [ ] `/admin/orders` → "Check stock matches payments" reports no mismatches
- [ ] Old Vercel project and dev Shopify store retired

---

## Known gaps (documented, not bugs)

- Fetchify address lookup is UI-only; manual entry works.
- The Shopify webhook checks only that a signature header exists, not that it's
  valid. It only clears the page cache — no money involved — but worth tightening
  before heavy production use.
- 13 Samsung sidebar links point at model families the reference site no longer
  stocks. They show "We can't find products matching the selection." rather than
  erroring.
