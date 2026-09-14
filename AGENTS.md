# AGENTS.md

## What This Is

Repo for **i.fleur**, a flower boutique in Antananarivo, Madagascar. Contains TWO distinct sites:

1. **`ifleur.html`** — legacy static single-file page (inline CSS/JS, base64 images, no build). Not the working app; ignore for new work.
2. **`i-fleur/frontend/`** — the ACTIVE app: 100% static, TypeScript + esbuild, deployed to Netlify. This is the primary working directory.

## Layout

- `ifleur.html` — legacy self-contained page (Google Fonts only external dependency)
- `site web.pptx` — spec / cahier des charges (design reference: saison-eshop.com). **Its euro prices are wrong — trust the Ariary figures in code.**
- `netlify.toml` — Netlify deploy: build `cd i-fleur/frontend && npm run build`, publish `i-fleur/frontend`, Node 20
- `i-fleur/` — active site (see `i-fleur/AGENTS.md` for code-level detail)
- No backend anywhere in this repo (the Fastify backend was removed/archived). Do not create or restore one.

## Commands (run in `i-fleur/frontend/`)

- **Dev**: `npm install && npm run dev` → bundles `src/ts/main.ts` → `dist/app.js` AND serves the dir on `:8000` (single command; don't run esbuild manually)
- **Build**: `npm run build` (esbuild minify → `dist/app.js`; Netlify runs this on deploy)
- **Typecheck**: `npx tsc --noEmit` — only static check (no tests, no linter)
- `dist/` is gitignored — never commit the bundle; always rebuild before testing/deploying

## Prices & config (high gotcha)

- All business data lives in **`src/ts/config.json`** (prices, vase price, sur-mesure min, WhatsApp number, shop info, delivery zones, FAQ). It is baked into the bundle at build time — no runtime network calls. Edit the JSON → rebuild → redeploy.
- Product prices are actually read from the `data-price` attributes on the size/vase buttons in **`index.html`**, so a price change must be made in **two places (`index.html` + `config.json`)** — keep them in sync or the total/recap will drift.
- Current prices (Ar): Mini 100 000 · S 80 000 · M 120 000 · L 150 000 · vase +20 000 · sur-mesure min 200 000.
- Delivery zones in `config.json`: `fee` `0` = free, `null` = "sur devis"/hors zone, plus a list of `quartiers`; périphérie = +20 000 Ar.

## Code layout

- Modules in `src/ts/`: `main.ts` (entrypoint), `data.ts` (config access), `pricing.ts` (total = size + vase + delivery), `delivery.ts` (quartier select), `billing.ts` (fields + validation), `payment.ts` (WhatsApp message), `selectors.ts`, `slider.ts`, `types.ts`, `utils.ts`.
- CSS split across `src/styles/*.css`.
- Imports use explicit `.js` extensions (e.g. `import { CONFIG } from './data.js';`).
- Ordering = WhatsApp only (`wa.me/261340476414` with a pre-filled message). No order storage / no back-office.

## Conventions (mandatory)

- Mark every code change with a comment:
  - `// NOUVEAU : [desc]` for new code
  - `// MODIFIÉ : [desc]` for changed code
- Comments in French; UI copy is bilingual FR/EN.
- Prices are in Ariary (`Ar`); ignore the euro figures from the pptx.
- Backend is COPY-PASTE ONLY — never hand-edit archived backend source; hand the user ready-to-integrate code.

## Key facts

- Payment: order via the WhatsApp form, pay by MVola, Sendwave/PayPal, or cash on delivery.
- Delivery: Antananarivo only; pickup free or home delivery (fee by quartier zone); 24h advance notice, same-day via phone.
- WhatsApp +261 34 04 764 14 · Instagram @ifleurmdg · Facebook @ifleurmadagascar.
- Legacy `ifleur.html`: prices hardcoded in `data-price` attributes + JS vars, NOT synced with the active site.