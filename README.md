# La Roue de Fortune — Bellepros

A self-contained, zero-dependency "spin the wheel" marketing game for the **Bellepros**
restaurant franchise (Laval, QC). One HTML file (`index.html`) turns an in-store
"spend $50+, spin for a prize" promo into a lead-generation and referral engine.

Everything runs in the browser — no build step, no server required. Drop `index.html`
on any static host (Netlify, Vercel, GitHub Pages, an S3 bucket) and it works.

---

## What it does

- **Spin-to-win wheel** — weighted prizes, guaranteed win, celebration + sound.
- **Lead capture** — after the spin, collects prénom + téléphone (+ optional courriel)
  with a **CASL/Loi 25 consent** opt-in, before revealing the prize.
- **Redemption codes** — every win gets a unique code (`BP<loc>-<time>-<rand>`) with a
  7-day expiry, shown in `DD/MM/YYYY`. Staff validate the code at the counter.
- **Share to earn** — native / Facebook / SMS share unlocks one **bonus spin per day**
  (customer mode). The shared link carries a referral code + UTM tags.
- **Google-review incentive** — a review CTA (direct review link or a Maps fallback).
- **Anti-abuse** — one spin per day per device in customer mode (day boundary in ET).
- **Attribution + analytics** — captures `utm_*` / `ref` / referrer; `track()` forwards
  events to Google Analytics / Meta Pixel / Plausible if installed (no-op otherwise).
- **Owner dashboard** — lead/consent/play counts, CSV export, campaign-link builder.

---

## URL parameters

| Param | Values | Purpose |
|-------|--------|---------|
| `loc` | a key in `LOCATIONS` (e.g. `440`) | Which franchise location. |
| `mode` | `kiosk` | In-store staff tablet: no daily limit, skippable form. Omit for customer mode. |
| `admin` | `1` | Shows the owner dashboard (keep this link private). |
| `ref` | any code | Referral attribution (auto-added to shared links). |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` | any | Campaign attribution. |

**Two ways to deploy the promo:**

- **Customer link** — put a QR code on receipts / table tents pointing at
  `…/index.html?loc=440&utm_source=recu&utm_medium=qr`. Each phone gets one spin/day.
- **Kiosk** — a store tablet at `…/index.html?loc=440&mode=kiosk`. Staff run it for each
  customer who shows a qualifying receipt; no daily limit.

The dashboard (`?admin=1`) has a **campaign-link builder** that generates these URLs for you.

---

## Configure a new franchise location

Edit the `LOCATIONS` object near the top of the `<script>` in `index.html`:

```js
const LOCATIONS = {
  '440': {
    code: '440',
    name: 'BELLEPROS 440',
    city: 'Laval, Québec',
    handle: '@bellepros440',
    site: 'belleproslaval440.com',
    reviewUrl: '',   // direct Google "write a review" link; blank = Maps search fallback
    privacyUrl: '',  // link to your privacy policy (Loi 25); shown on the form if set
    // segments: [...]  // optional per-location prize table (see below)
  },
  'stjerome': {
    code: 'stjerome',
    name: 'BELLEPROS St-Jérôme',
    city: 'St-Jérôme, Québec',
    handle: '@bellepros',
    site: 'bellepros.com',
    reviewUrl: '',
    privacyUrl: '',
  },
};
```

Then link to `…/index.html?loc=stjerome`.

### Custom prizes per location

Add a `segments` array to a location to override the default wheel. Put all winnable
segments first (`prob > 0`, summing to 1.0) and an optional filler segment (`prob: 0`)
last for visual balance:

```js
segments: [
  { label: 'Boisson\nGratuite', prob: 0.25, value: 3,  color: '#1a6b3c', desc: '...' },
  { label: '50$\nJACKPOT',      prob: 0.05, value: 50, color: '#c41e3a', desc: '...' },
  // ...
],
```

Adjust the promo threshold and code expiry in the `CAMPAIGN` object.

---

## Install analytics (optional)

Paste your Google Analytics / Meta Pixel / Plausible snippet into `<head>`. The game's
`track()` function automatically forwards these events — no extra wiring:

`promo_view`, `spin_start`, `spin_result`, `lead_submit`, `lead_skip`,
`share_click`, `share_bonus_granted`, `review_click`.

## Central lead backend (optional)

By default leads live in the browser (`localStorage`) and are exported from the dashboard
as CSV — fine for a single tablet, but each device holds its own separate list. To collect
leads from **every location and every device into one place**, point the wheel at a backend
via the `BACKEND` config near the top of the `<script>` in `index.html`. Leads are still
saved locally too (belt + suspenders), so a network hiccup never loses a lead.

### Option A — Supabase (recommended)

1. **Create the table.** Run [`supabase/migrations/20260721000000_wheel_leads.sql`](supabase/migrations/20260721000000_wheel_leads.sql)
   in your project (Supabase SQL editor, or `supabase db push`). It creates a `wheel_leads`
   table with **insert-only** Row Level Security: the public page can add leads with the
   anon key, but that key can never read, update, or delete rows.
2. **Wire the client.** In `index.html`, set:
   ```js
   const BACKEND = {
     type: 'supabase',
     url: 'https://YOUR-PROJECT.supabase.co',   // Project Settings → Data API → URL
     anonKey: 'eyJhbGciOi...',                   // the publishable (anon) key
     table: 'wheel_leads',
   };
   ```
   The anon/publishable key is designed to be public; RLS is what protects the data.
3. **Read your leads** (service role — SQL editor or Table editor):
   ```sql
   select name, phone, email, location, prize, code, consent, inserted_at
   from public.wheel_leads
   where consent = true
   order by inserted_at desc;
   ```

> Want a hardened setup with no table exposed at all? Put the same insert behind a Supabase
> **Edge Function** (service-role, server-side, add rate-limiting), and set `type: 'webhook'`
> with the function URL instead. The client payload is identical.

### Option B — Any webhook

Set `type: 'webhook'` and `webhookUrl` to any endpoint (Zapier, Make, your own API). Each
lead is POSTed as JSON with the same shape as the CSV columns.

---

## Operational notes

- **Kiosk tablets accumulate customer contact info in `localStorage`.** Export
  (dashboard → *Exporter les leads*) regularly and use *Effacer les données locales*
  to clear the device, or configure the `BACKEND` (see below) so data lives on your
  server instead.
- The promo is framed as a free bonus on purchase and **is not a lottery** under
  Quebec's *Loi sur les loteries*. Review the footer's legal text and your consent
  wording with a legal advisor before launch.

## Branding

The Restaurant Bellepro's logo is embedded directly in `index.html` as a transparent
PNG data URI (`LOGO_SRC` near the top of the `<script>`), so the page stays a single
self-contained file. It appears in three places: the nav bar, the wheel's centre
medallion (drawn on canvas, on a cream face so the badge keeps its contrast against
the gold rim), and the footer. To swap it, replace that one string with your own
`data:image/png;base64,…` (or `data:image/svg+xml;base64,…`) value — all three
placements update together.

## Files

- `index.html` — the production page (the deployed artifact).
- `wheel.jsx` — a standalone React component of the core wheel, for embedding in a
  Next.js/React app. The full marketing funnel lives in `index.html`.
- `generate-docx.mjs` — generates the storyboard document.
