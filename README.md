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

## Send leads to a backend (optional)

By default leads are stored in the browser (`localStorage`) and exported from the
dashboard as CSV. To also POST each lead server-side (e.g. a Supabase Edge Function),
set `LEAD_WEBHOOK` to your endpoint URL in `index.html`.

---

## Operational notes

- **Kiosk tablets accumulate customer contact info in `localStorage`.** Export
  (dashboard → *Exporter les leads*) regularly and use *Effacer les données locales*
  to clear the device, or configure `LEAD_WEBHOOK` so data lives on your server instead.
- The promo is framed as a free bonus on purchase and **is not a lottery** under
  Quebec's *Loi sur les loteries*. Review the footer's legal text and your consent
  wording with a legal advisor before launch.

## Files

- `index.html` — the production page (the deployed artifact).
- `wheel.jsx` — a standalone React component of the core wheel, for embedding in a
  Next.js/React app. The full marketing funnel lives in `index.html`.
- `generate-docx.mjs` — generates the storyboard document.
