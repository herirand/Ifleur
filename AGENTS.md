# AGENTS.md — Ifleur (i.fleur, flower boutique, Antananarivo)

## What this repo is

One product: **`i-fleur/app/`** — a monolith. A single Fastify server serves the API (`/api/*`)
*and* the static frontend (`public/`). **No database, no tests, no linter, no CI, no formatter.**
Orders have exactly one side effect: an EmailJS email to the customer.

Everything under `i-fleur/` is documented in **`i-fleur/AGENTS.md`**, which is auto-loaded in that
subtree. This file holds only the cross-cutting facts and the traps.

Stale / do-not-trust sources:
- `i-fleur/README.md` — describes a removed static-only `frontend/` arch (no backend, Netlify, :8000, `src/ts/config.json`, +8 000 Ar vase). Wrong.
- `ifleur.html` (1 MB, root) — legacy single-file page, hardcoded prices, not synced with the app.
- `site web.pptx` (root) — design spec; its **euro prices are wrong**, trust the Ariary in code.
- `theme-pretty.css` (root) — 0-byte leftover.
- `MIGRATION-PRIX-BACKEND.md` — cited by `i-fleur/AGENTS.md` but never committed. Its rules are already captured in both AGENTS.md files; don't hunt for it.

## Commands (all run from `i-fleur/app/`)

| Command | Effect |
|---|---|
| `npm install` | `esbuild` + `@fastify/static` are **runtime** deps — required to boot, not just build |
| `npm run dev` | `tsx watch --ignore src/ts --ignore public src/app.ts` — tsx watch (server) + esbuild watch (frontend) in one process, `:3000` |
| `npm run build` | esbuild `src/ts/main.ts` → `public/dist/app.js`, minified |
| `npm run build:server` | esbuild `src/app.ts` → `dist/server.cjs` (cPanel entry) |
| `npm start` | `NODE_ENV=production tsx src/app.ts` — the server itself builds the frontend bundle once at boot, so no separate `npm run build` |
| `npm run serve` | `npm run build` + `npm start` (explicit build first, then same as above) |
| `npm run typecheck` | `tsc --noEmit` — **frontend only** |

## Traps that will bite you

- **cwd is load-bearing.** `PUBLIC_DIR`, the esbuild entry `src/ts/main.ts` and `.env` all resolve
  from `process.cwd()`. `node dist/server.cjs` **must** be launched from `i-fleur/app/`, else you get
  an empty web root and a server that won't boot.
- **`config.json` is a static `import`, not a `fs` read** (`config.service.ts`, `order.service.ts`).
  esbuild inlines it — so editing `src/config/config.json` requires `npm run build:server` again, or
  cPanel keeps serving old prices.
- **`npm run typecheck` does not cover the server.** `tsconfig.json` has `include: ["src/ts/**/*"]`,
  so `src/app.ts` and all of `src/modules/` are **never typechecked**. Backend type errors only surface
  at runtime / at bundle time.
- **`dist/` and `public/dist/` are gitignored** but `server.cjs` / `app.js` sit on disk as untracked
  build artifacts. They can be stale — rebuild before trusting or deploying them.
- 🚫 Never `pkill -f "tsx"` / `pkill -f "src/app.ts"` from an interactive shell: the pattern matches
  the shell's own command and kills it. Kill by port: `ss -tlnp | grep :3000`.
- `ensureFrontendBuilt()` **blocks startup** (awaited before `app.listen`); a build failure exits 1.
- Git: branch `main`, 9 commits, messages are **terse lowercase words** (`readme`, `mailjs implemented`)
  — no conventional-commit prefixes. No PR process in the repo.

## Verifying a change

No test suite exists. Verification is manual, in this order:

```bash
npm run typecheck && npm run build:server     # frontend types + server bundles
npm run dev                                    # then, from another shell:
curl -s localhost:3000/api/config | head -c 300
curl -s -X POST localhost:3000/api/order/quote -H 'content-type: application/json' \
  -d '{"size":"M","vase":true,"deliveryMode":"home","quartier":"Alarobia"}'
```

`/api/order/quote` returns `{ basePrice, vasePrice, deliveryFee, total, isDevis, deliveryIsDevis }`.
`POST /api/order` needs `size, vase, color, deliveryMode, billing{nom,tel,email}, paymentMethod`
(`paymentMethod` is exactly `'Mvola'` — capital M — or `'carte'`; unknown props are rejected).
Finish by opening both `/` and `/paiement.html` in a browser.

## Deploy (cPanel)

`git pull` on the host, then from `i-fleur/app/`: `npm ci && npm run build:server && node dist/server.cjs`.
The frontend bundle is rebuilt by the server itself at boot, so `npm run build` is not needed there.
`public/`, `src/config/config.json` and the four EmailJS env vars must be present on the host.

## Server architecture (non-obvious bits)

- `src/app.ts` order matters: CORS (localhost origins only) → error handler → routes under prefix
  `/api` → `@fastify/static` root `public/` → SPA fallback. The 404 handler serves `index.html` for
  extensionless GETs but keeps a **real 404 for `/api/*`, any path with a file extension, and any
  dotfile segment** (`/.env`, `/src/ts/*`) — that's what keeps `.env` and the server tree unexposed.
- `src/routes/routes.ts` registers **2** module routers: `config`, `order`. Each module is a
  `service / controller / route / dto` quad; routes live in `*.route.ts`. `email/` keeps only
  `service` + `dto` (no route — it is called by `order.service`); `payment/` keeps only
  `service` + `dto` (no route).
- `AppError` signature is **status-first**: `new AppError(statusCode, message, code?)`
  (`src/lib/appError.ts`). Serialized as `{ statusCode, error: code, message }`.

### Env vars

`i-fleur/app/.env` (untracked, gitignored) — exactly four keys, no `.env.example` committed:
`EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`.
**The server boots fine without them** — the failure only surfaces at order time as
`500 EMAILJS_CONFIG_MISSING`, i.e. every customer order 500s while the site looks healthy.
Email failure is **not** swallowed: it aborts the order, with no queue or retry, so an EmailJS
outage silently loses orders.

## Pricing

Source of truth = `app/src/config/config.json`, served by `GET /api/config`. `renderPricesFromConfig()`
rewrites the `.c-label` amounts in `public/index.html` from that config, so those hardcoded amounts are
pure pre-JS fallback — the `data-price-label` attributes that used to tag them were removed (nothing
read them). Keep the text roughly in sync anyway. Prices (Ar): Mini 80 000 · S 100 000 · M 120 000 ·
L 150 000 · vase +20 000 · sur-mesure min 200 000. (`#total-display` ships as `—`, not a hardcoded
amount: showing `80 000 Ar` pre-JS was wrong, the default size being S.)

`computeQuote()` in `src/modules/order/order.service.ts` is the **only** price implementation; the
frontend contains zero price arithmetic (it only formats server values). Called from both
`POST /api/order/quote` and `POST /api/order`, so a submitted order is always re-priced server-side.

```
total = basePrice + vasePrice + deliveryFee     // null when size === 'custom'
```
- `isDevis` / `total: null` — **only** for `size: 'custom'`.
- `deliveryIsDevis` — `deliveryMode: 'home'` + a quartier that matches no zone, or matches a zone with
  `fee: null`. ⚠️ It does **not** null the total: an out-of-zone order gets a real numeric total with
  `deliveryFee: 0`, and is accepted. Don't assume "sur devis" means "no total".
- `surMesureMin` (200 000 Ar) is **never enforced** — display text only; `custom` always prices 0.
- Delivery zones: A Centre-ville (25 quartiers) and B Première couronne (9) are `fee: 0`; C Périphérie
  (13) and D Grande périphérie (3) are `fee: 20000`; the final zone `"Autre / hors zone"` has
  `quartiers: []` + `fee: null` and acts as the out-of-zone fallback — excluded from the
  `<select>` but used by `findZoneForQuartier()` on both server and frontend. Quartier matching is
  case-insensitive exact.

## Frontend (`app/src/ts/`, bundled once for both pages)

`main.ts` dispatches on `#checkout-page`: present → `initSlider()` + `initCheckout()` and **return**;
absent → `init()` (`loadConfig()` awaited, then slider → pricing → selectors → delivery → billing →
payment → restore → shop config → price labels). The checkout path also awaits `loadConfig()` (it needs
`loadConfig()` for the proof-of-payment link) and catches failures so the page still starts.

The photo slider (`slider.ts`, shared by both pages) is a crossfade driven **only** by the `active`
class — no CSS/HTML change is needed to add behaviour to it. It **autoplays every 4 s** (`AUTOPLAY_MS`)
and keeps manual navigation. Every manual jump calls `syncAutoplay()` afterwards, which restarts a full
4 s. `syncAutoplay()` is the single play/pause authority, gated by three flags: `hovered` (bound to
`.col-photo`, **not** `#slider` — the arrows and dots are its *siblings*, so a `mouseenter` on `#slider`
would never fire on a control), `docHidden` (`visibilitychange`) and `reducedMotion`
(`prefers-reduced-motion`, which disables autoplay while manual nav still works). A click while hovered
deliberately does *not* restart, otherwise you could never freeze a photo.

⚠️ The fade is **0.5 s**, a deliberate deviation from saison-eshop's `speed: 100`. Measured: at 100 ms the
crossfade spans only 6 frames and reads as a hard cut, not an animation. Measured on the 0.5 s version:
median and p99 frame = 16.7 ms (60 fps), ~1 dropped frame per transition. All 4 photos are fetched
together at page load (~0.9 s), *not* lazily per slide — so a slide is never blank; don't "optimise" this
with lazy-loading, it would introduce exactly that blank-frame bug. The `translateZ(0)` +
`backface-visibility: hidden` on `.slide` is a GPU-promotion hint whose benefit could **not** be isolated
in an A/B here (Chrome was software-rendered); it is kept as a standard, low-risk hint, not a proven win.

Flow: home configurator → `pricing.ts` POSTs the selection to `/api/order/quote` (debounced **150 ms**)
and renders the reply → `payment.ts` validates and stores `{ payload, quote }` under the single
`sessionStorage` key **`'ifleur_order'`** (`paymentMethod` is *not* stored; it is added on the pay
page) → `/paiement.html` → `checkout.ts` re-quotes, recaps, then `POST /api/order` and clears storage.
"Modifier" redirects to `/`; `restore.ts` re-applies the stored payload to the configurator. Payment
methods are **MVola + carte only**. Two distinct WhatsApp links: `#btn-whatsapp` (home) is **contact
only** — no order payload; `#co-wa-proof` (payment page, in the MVola box) asks the customer to **send a
screenshot of their payment**, pre-filled by `initWhatsappProof()` with `whatsappNumber` + the server
quote total (no local arithmetic). Don't mistake the second for a regression.

DOM contract: don't rename `#checkout-page`, `#total-display`, `#btn-checkout`, `#order-status`,
`#size-row .c-btn[data-size] .c-label`, `#quartier-select`, `#delivery-fee-info`, `#co-total-display`,
`.r-btn[data-pay]`, `#btn-pay`, `#co-wa-proof` or the `.card-input` fields — the TS queries them directly and
toggles an `.error` class on them at runtime (`.error` is never in the HTML, don't add it).
`retraitGratuit` is now read by `delivery.ts` instead of a hardcoded "gratuit" string.

`tsc --noEmit --noUnusedLocals --noUnusedParameters` is the dead-code gate: it was **0 error** after
the cleanup, so keep it at 0. `setText()` in `utils.ts` is the single id→textContent helper and
`ORDER_COLORS` in `types.ts` the single colour list — don't re-duplicate them.

## Known issues (don't "rediscover" these as new)

- **No payment verification.** `createOrder()` (`order.service.ts`) validates the method then sends the
  email — it never calls any payment API. A `POST /api/order` with `paymentMethod: 'Mvola'` produces a
  confirmed order with no payment check. The real integration goes at the `// TODO API externe` marker
  in `createOrder()`. (`POST /api/payment` and its `processPayment()` stub were removed — it was
  behaviourally inert; `validatePaymentMethod` + `PAYMENT_LABEL` are still live and used.)
- **No persistence, no idempotency, no rate limiting.** A retried `POST /api/order` sends a second
  email; a flood floods EmailJS quota.
- DTO validation is thin: no `format: 'email'`, no `maxLength` on any string, `recipient` has no
  required subfields, and `deliveryMode: 'home'` does not require `recipient`/`deliveryDate`/`quartier`.
- `POST /api/email/send` (unauthenticated public mail relay, called by nothing) was **removed** —
  don't reintroduce it. `email.service.ts` + `SendEmailDto` must stay: `order.service` depends on them.

## Conventions (mandatory)

- Mark every code change: `// NOUVEAU : [desc]` for new code, `// MODIFIÉ : [desc]` for changed code.
- Comments and UI copy in **French** (Malagasy market); FR/EN bilingual labels are fine.
- Prices in **Ariary (`Ar`)**. Ignore the € in the pptx.
- Frontend imports carry an explicit `.js` extension (`import './pricing.js'`); server imports are
  extension-less. Bundler `moduleResolution` needs this split.
- **Backend changes are shipped copy-paste and integrated by the user** — never edit server code
  without explicit consent (root `~/.config/opencode/AGENTS.md` rule, restated in `i-fleur/AGENTS.md`).
