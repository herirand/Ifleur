# AGENTS.md

## What This Is

Repo for **i.fleur**, a flower boutique in Antananarivo, Madagascar. Contains TWO distinct sites:

1. **`ifleur.html`** — legacy static single-file page (inline CSS/JS, base64 images, no build).
2. **`i-fleur/`** — active frontend site. **100% static, no backend in production** (deployed to Netlify). This is the primary working app.

## Structure

- `ifleur.html` — self-contained legacy page; all CSS/JS inline, Google Fonts only dependency
- `site web.pptx` — the spec / cahier des charges (design reference: saison-eshop.com; prices in pptx are EUROS — the Ariary prices in code are correct)
- `netlify.toml` — Netlify static deploy (build command + publish dir)
- `i-fleur/frontend/` — the active static site
- `i-fleur/backend/` — **archived, NOT deployed** (Fastify skeleton from an earlier approach; Netlify free can't run node servers). Do not touch; keep as reference only
- `i-fleur/to/backend/` — source/backup copy of that backend (entrypoint `index.ts`); legacy, do not edit

## i-fleur Frontend (active)

Stack: TypeScript + esbuild. No framework, no runtime network calls (config is imported JSON). JSON storage inside the bundle.

### Commands
- **Dev**: `cd i-fleur/frontend && npm install && npm run dev` → esbuild bundles `src/ts/main.ts` → `dist/app.js` AND serves the dir (`--servedir=.`) on `:8000`; one command does both
- **Build**: `cd i-fleur/frontend && npm run build` (esbuild minify → `dist/app.js`)
- **Typecheck**: `cd i-fleur/frontend && npx tsc --noEmit`
- No test framework, no linter configured
- Never commit `dist/app.js`? (`dist/` is gitignored; Netlify rebuilds it)

### Key facts
- All prices, WhatsApp number, shop info, delivery zones, and FAQ live in **`src/ts/config.json`** (imported directly into the bundle). To change a quartier/delivery fee: edit that JSON, then `npm run build`, then redeploy.
- Delivery zones: each zone has `fee` (`0` = free, `null` = "sur devis"/hors zone) + list of `quartiers`.
- Frontend modules: `main.ts` (orchestration), `data.ts` (config access), `pricing.ts` (total = price + vase + delivery fee), `delivery.ts` (quartier select), `billing.ts` (billing fields + validation), `payment.ts` (WhatsApp message + validation), `selectors.ts`, `slider.ts`. No `api.ts` — the API client was removed.
- Ordering = WhatsApp only (wa.me/261340476414 with a pre-filled message). No backend / no order storage / no back-office.

### Editing conventions (mandatory)
- Mark every change: `// NOUVEAU : [desc]` for new code, `// MODIFIÉ : [desc]` for changed code
- Backend code is COPY-PASTE ONLY — if backend work is ever needed, never edit `i-fleur/backend/src` directly; hand the user ready-to-integrate code

## Key Context

- Language: French (Malagasy market)
- Currency: Ariary (Ar); prices S=40k, M=60k, L=80k, vase +8k, périphérie +20k (from pptx zones)
- Payment: WhatsApp ordering, MVola, Sendwave/PayPal, cash on delivery
- Delivery: Antananarivo only, pickup (free) or home delivery (fee by quartier zone); 24h advance notice, same-day via phone
- WhatsApp: +261 34 04 764 14
- Contact: Instagram @ifleurmdg, Facebook @ifleurmadagascar

## Editing Notes

- Legacy `ifleur.html`: prices hardcoded in `data-price` attributes and JS vars
- i-fleur: config from `src/ts/config.json`; CSS/TS split across `src/styles/*` and `src/ts/*`
- Deploy: Netlify → repo root, build `cd i-fleur/frontend && npm run build`, publish `i-fleur/frontend`
- No tests, no linting, no build step for the legacy page; i-fleur has a `build` step