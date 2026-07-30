# Publishing to the App Store & Google Play

The game ships as a native app through [Capacitor](https://capacitorjs.com): the same
`index.html` that runs the website and the in-store kiosk is bundled inside a native iOS
and Android shell, so there is **one codebase to maintain**, not three.

Native behaviour is already wired (see `Native` in `index.html`): real haptics, the native
share sheet, a splash screen, status-bar theming, and a local notification reminding the
player when their next free spin unlocks. In a plain browser every one of those calls
degrades to the web API or no-ops.

---

## 0. What you need first

| | Apple App Store | Google Play |
|---|---|---|
| Account | Apple Developer Program — **99 USD/year** | Play Console — **25 USD one-time** |
| Machine | **macOS + Xcode** (required, no way around it) | Any OS + Android Studio |
| Signing | Automatic signing in Xcode | Upload keystore (keep it safe — it can't be replaced) |
| Review time | ~24–48 h typical | ~1–7 days, longer for a new account |

Register the developer account **as Bellepros (the business)**, not as a personal account:

- Apple requires that a contest/promo app be **sponsored by the developer of the app**
  (Guideline 5.3). The account holder and the promo sponsor must match.
- Google Play requires new **personal** accounts to run a closed test with **12 testers for
  14 days** before production. **Organization accounts are exempt** — this alone can save
  you two weeks.

You will also need a **publicly reachable privacy policy URL**. A ready template is in
[`PRIVACY.md`](PRIVACY.md) — publish it at e.g. `https://belleproslaval440.com/privacy`.

---

## 1. Build it

```bash
npm install

# Generate every icon and splash size from assets/icon.png + assets/splash.png
npm run assets

# iOS (macOS only)
npm run add:ios
npm run open:ios        # → Xcode: set Team, then Product ▸ Archive ▸ Distribute

# Android
npm run add:android
npm run open:android    # → Android Studio: Build ▸ Generate Signed Bundle (.aab)
```

After **any** change to `index.html` or `assets/`:

```bash
npm run sync            # rebuilds www/, pushes it into both native projects,
                        # and reinstalls the Android notification icon
```

> **Android status-bar icon.** `npm run sync` copies `assets/android-notification/` into
> `android/…/res/drawable-*/ic_stat_icon.png` (the icon `capacitor.config.json` points at).
> It is a **white-on-transparent** wheel glyph on purpose: Android discards colour and keeps
> only the alpha channel, so the full-colour badge would appear as a solid white blob.
> `@capacitor/assets` does not generate this one, and `android/` is regenerated, which is why
> it is a build step rather than a committed native file.

`ios/` and `android/` are gitignored — they're generated. Commit them only if you start
hand-editing native code or signing in CI.

### Version bumps
Increment before every submission, or the upload is rejected:
- **iOS** — Xcode ▸ target ▸ *Version* (1.0.1) and *Build* (must always increase).
- **Android** — `android/app/build.gradle`: `versionCode` (integer, must increase) and `versionName`.

---

## 2. Store listing copy

**App name** (30 chars max on both):
> `Roue Bellepro's`

**Subtitle / short description** (30 / 80 chars):
> FR — `Tourne la roue, gagne des prix!`
> EN — `Spin the wheel, win prizes!`

**Full description (FR — primary, required for Quebec):**
```
La Roue de Fortune de Restaurant Bellepro's!

Dépense 50$ ou plus chez Bellepro's, montre ton reçu au comptoir et tourne la roue.
Tout le monde gagne — il n'y a aucun perdant.

À GAGNER
• Boisson gratuite
• Dessert gratuit
• 10$ de rabais
• Poutine gratuite
• 25$ en bouffe
• Upgrade combo
• JACKPOT 50$

COMMENT ÇA MARCHE
1. Commande 50$+ chez Bellepro's
2. Montre ta facture au comptoir pour débloquer ton tour
3. Tourne la roue et gagne un prix garanti
4. Montre ton code de réclamation au comptoir

Un tour gratuit par visite admissible. Ton code est valide 7 jours.

Cette promotion est un bonus gratuit sur achat. Aucun achat additionnel n'est requis
pour participer au jeu. Ce n'est pas une loterie au sens de la Loi sur les loteries du
Québec.
```

**English version** — same structure; keep French first, it is the primary market.

**Keywords (Apple, 100 chars):**
`bellepros,roue,fortune,prix,restaurant,laval,poutine,concours,récompense,fidélité`

**Category:** Food & Drink (primary) · Lifestyle (secondary)

**Screenshots** — required sizes: iPhone 6.7" (1290×2796) and 6.5"; Android phone
(min 1080px wide) plus a 1024×500 feature graphic. Capture the wheel, a win card, and the
prize table. `assets/og-image.png` works as the Play feature graphic.

---

## 3. Privacy declarations — read this carefully

The app **collects a name, phone number, and optional email** on the prize form. Both
stores require you to declare that, and the answers differ depending on your setup:

| | `BACKEND.type = null` (default) | `BACKEND.type = 'supabase'` |
|---|---|---|
| Where data goes | Stays on the device only | Sent to your Supabase project |
| Apple: *Data Linked to You* | Contact Info — **not collected** by you | **Contact Info: Name, Phone, Email** |
| Apple: *Data Use* | — | Developer's Advertising or Marketing |
| Play Data Safety | "No data collected" | **Personal info: Name, Phone, Email — collected, not shared** |
| Play: encrypted in transit | — | **Yes** (HTTPS) |
| Play: deletion request | — | **Yes** — provide your contact email |

Declare it **as configured at submission time**. If you enable Supabase later, update the
declarations before shipping that build — a mismatch is a common rejection reason.

Tracking: the app does **not** use IDFA or an ad SDK, so answer **No** to App Tracking
Transparency. The `utm_*` parameters are first-party campaign attribution, not tracking
across other companies' apps.

---

## 4. Age rating & the "is this gambling?" question

This trips people up. The wheel is **not gambling**, and the answers should say so:

- There is **no wager** — the spin is a free bonus on a purchase already made.
- There is **no chance of loss** — every spin wins a prize.
- Prizes are **merchandise, never cash or anything cashable**.

**Apple** (Guideline 5.3 — Gaming, Gambling, Lotteries): answer the questionnaire's
*Contests* item honestly (Infrequent/Mild) — expect **12+**. Guideline 5.3.4 requires the
**official rules to be displayed in the app**: they are, in the footer of the page. Do not
answer "Simulated Gambling" — that would force 17+ and mischaracterise the app.

**Google Play** — the IARC questionnaire asks about gambling: answer **No** to real
gambling and simulated gambling. Expect **Everyone / PEGI 3**.

### App Review notes (paste this into the review form — it prevents most rejections)
```
Roue Bellepro's is the in-store loyalty promotion for Restaurant Bellepro's, a
restaurant in Laval, Quebec. The developer account holder is the promotion sponsor.

This is NOT gambling: customers do not wager anything, cannot lose, and every spin
wins a guaranteed prize. The spin is a free bonus for a purchase already made in the
restaurant; prizes are food/merchandise items redeemed at the counter and are never
exchangeable for cash. Official rules are shown in the app footer.

The app works fully offline. No account or login is required — you can exercise all
functionality immediately by tapping TOURNER!. The contact form is optional and can be
skipped with "Voir mon prix sans laisser mes infos".
```

---

## 5. Apple Guideline 4.2 — "Minimum Functionality"

Apple rejects apps that are just a repackaged website. This build deliberately provides
native value beyond the web page:

- **Fully offline** — the game is self-contained; no network is needed to play.
- **Native haptics** (`@capacitor/haptics`) — iOS Safari has no web vibration API at all.
- **Native share sheet** (`@capacitor/share`).
- **Local notification** reminding the player when the next free spin unlocks — genuine
  native re-engagement, impossible on the mobile web.
- **Native splash screen and status-bar theming**.

If review still pushes back, respond that the app is an **in-store companion for a
physical restaurant's loyalty program** (Apple explicitly permits this for a business's own
customers) and point at the offline play and notification features.

---

## 6. Submission checklist

- [ ] Developer accounts registered **to the business**
- [ ] Privacy policy published at a public URL (from `PRIVACY.md`)
- [ ] `npm run assets` — icons and splashes generated
- [ ] Version / build number incremented
- [ ] Screenshots captured at required sizes
- [ ] Privacy labels + Data Safety filled in to match `BACKEND.type`
- [ ] Age rating questionnaires answered (contest = yes, gambling = no)
- [ ] Review notes pasted (section 4)
- [ ] Tested on a real device — spin, prize code, share sheet, notification permission

---

## Alternative: Play Store without Capacitor

For Android only, `manifest.webmanifest` already makes the site an installable PWA, so you
can ship it as a **Trusted Web Activity** with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
instead. It's less work, but it needs the site to be live at a verified domain and gives you
no offline guarantee or notifications. **Apple does not accept PWAs**, so Capacitor remains
the path for iOS.
