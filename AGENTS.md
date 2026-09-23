# AGENTS.md — Ifleur (i.fleur flower boutique, Antananarivo)

## What this repo is

Active product = **`i-fleur/`**: a monolith — one Fastify server (`app/`) serves the API
(`/api/*`) and the static frontend (`app/public/`). No database. Prod target = serveur cPanel
(`node dist/server.cjs`).

**`i-fleur/AGENTS.md` is authoritative for everything under `i-fleur/`** — it is
auto-loaded in that subtree and carries the exact layout/flow. Trust it over this file's summary.

Docs to trust:
- `MIGRATION-PRIX-BACKEND.md` (root) — completed spec: **all price computation now lives
  server-side** (`POST /api/order/quote`); the frontend has no price arithmetic.

Stale sources to NOT trust:
- `i-fleur/README.md` — describes the removed static-only `frontend/` architecture
  (no backend, Netlify, localhost:8000). Ignore it.
- `site web.pptx` (design spec) — **euro prices are WRONG**; trust the Ariary values in code.
- `ifleur.html` (root) — legacy single-file page, hardcoded prices, not synchronized with the app.
- `INTEGRATION-EMAILJS.md` (root) — EmailJS integration doc, already implemented.

## Commands (run in `i-fleur/app/`)

| Command | What it does |
|---------|--------------|
| `npm install` | deps — esbuild + `@fastify/static` are **runtime deps**, required to run |
| `npm run dev` | `tsx watch --ignore src/ts --ignore public src/app.ts` — esbuild watch + server :3000 (single command) |
| `npm run build` | esbuild frontend → `public/dist/app.js` (minified) |
| `npm run serve` | build + `NODE_ENV=production tsx src/app.ts` (once, no watch) |
| `npm run build:server` | esbuild server → `dist/server.cjs` (entry cPanel `node dist/server.cjs`) |
| `npm run typecheck` (alias `npx tsc --noEmit`) | typecheck frontend only (`src/ts/**`); no tests, no linter |

Gotchas:
- Server auto-builds the frontend bundle on start (`ensureFrontendBuilt`): watch in dev, once in prod.
- `dist/` and `public/dist/` are gitignored → always rebuild before testing/deploying.
- 🚫 Never run `pkill -f "tsx"` / `pkill -f "src/app.ts"` from an interactive shell — the pattern
  matches the shell's own command and kills it. Kill by port: `ss -tlnp | grep :3000`.

## Architecture / API (post-migration)

Backend `app/src/` — modules are service/controller/route/dto pairs:
- `GET /api/config` — serves `src/config/config.json` (prices, WhatsApp, shop, delivery zones, FAQ).
  This is the single config endpooint: `src/ts/config.json` no longer exists.
- `POST /api/order/quote` — **the only price computation**. Input size/vase/deliveryMode/quartier
  → basePrice, vasePrice, deliveryFee, total (`null` = devis).
- `POST /api/order` — validates, recalcs quote, sends the confirmation email to the client
  (`billing.email`) via EmailJS (`modules/email`, keys in `.env` server-side).
- `POST /api/payment` — placeholder (`status:'pending'`); the real external payment API goes at
  `// TODO API externe` in `modules/payment/payment.service.ts`.

Frontend `app/src/ts/`: config loaded via `loadConfig()` (GET /api/config); `pricing.ts` sends
the selection to the quote API (debounced **150 ms**) and renders the server result.

Order flow: home configurator → `payment.ts` stores the pending order in
`sessionStorage['ifleur_order']` → redirect `/paiement.html` → `checkout.ts` re-quotes at the
backend, picks MVola/carte, « Payer » → `POST /api/order`. `main.ts` dispatches the checkout page
on presence of `#checkout-page`. WhatsApp button = **contact only** (no order payload).
Offered payment methods: **MVola + carte only** (especes/sendwave removed).

## Pricing (verify, don't trust HTML)

Source of truth = `app/src/config/config.json` (server). The `data-price-label` amounts hardcoded
in `public/index.html` are only pre-JS fallbacks — `renderPricesFromConfig()` overwrites them —
but keep them matching anyway. Prices (Ar): Mini 80 000 · S 100 000 · M 120 000 ·
L 150 000 · vase +20 000 · sur-mesure min 200 000.
Formula: `total = basePrice + vasePrice + deliveryFee`; `custom` → `isDevis: true`;
out-of-zone (`fee: null`) → `deliveryIsDevis: true, deliveryFee: 0`.

Delivery zones (`config.json .delivery.zones`): `fee: 0` = free, `fee: N` = fee,
`fee: null` = "sur devis"/hors zone; zone with empty `quartiers` + `fee: null` = out-of-zone
fallback (excluded from the quartier `<select>`).

## Conventions (mandatory)

- Every code change marked: `// NOUVEAU : [desc]` / `// MODIFIÉ : [desc]`.
- Comments & UI in **French** (Malagasy market); FR/EN bilingual labels OK.
- Prices in **Ariary (`Ar`)**.
- Frontend imports use explicit `.js` (`import './pricing.js'`); server imports use extension-less paths.
- Backend code is shipped copy-paste and integrated by the user (per `MIGRATION-PRIX-BACKEND.md`);
  never modify server code without explicit consent.