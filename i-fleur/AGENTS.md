# AGENTS.md

## What this repo is

**i.fleur** is a single, **100% static** frontend for a flower boutique in Antananarivo, Madagascar. No backend lives in this repo — ordering is done over WhatsApp with a pre-filled message. There is **no `netlify.toml`, no `backend/`, no `ifleur.html` here**; those live in the parent `Ifleur/` repo. Deploy config, legacy spec, and pricing history are documented in the parent `Ifleur/AGENTS.md` — trust this file for code inside `frontend/`.

## Layout

- `frontend/` — the whole app (TypeScript + esbuild, no framework, no runtime network calls)
  - `src/ts/main.ts` — entrypoint, orchestration + shop config / FAQ rendering
  - `src/ts/*.ts` — feature modules (pricing, delivery, billing, payment, slider, selectors)
  - `src/ts/config.json` — **all prices, WhatsApp number, shop info, delivery zones, FAQ** (imported into the bundle)
  - `src/ts/types.ts` — shared types
  - `src/styles/*.css` — CSS split by section
  - `index.html` — references the esbuild output `dist/app.js`
  - `dist/` — build output, **gitignored** (CI/Netlify rebuilds it)

## Commands (run in `frontend/`)

```bash
npm install
npm run dev      # esbuild bundle --watch + file server on :8000 (single command)
npm run build    # minified bundle -> dist/app.js
npx tsc --noEmit # typecheck
```

- `dev` does **both** bundling and serving. Don't run esbuild manually.
- No test framework, no linter configured. `npx tsc --noEmit` is the only static check.
- `dist/` is gitignored and never committed — always rebuild before testing/deploying.

## Config data flow (important)

Everything business-configurable lives in **`src/ts/config.json`**, imported directly into the bundle (`data.ts` exports `CONFIG`). There is no `fetch`/API — the JSON is baked into `app.js` at build time. **Changing delivery zones, prices, or FAQ requires editing that JSON, then `npm run build` (or `dev`), then redeploy** — editing the HTML/TS alone will not change behavior.

> `README.md` in this folder is stale (it claims vase = +8 000 Ar; code says +20 000 Ar, see `config.json` and the vase button in `index.html`). Trust code, not the README.

Delivery zones semantics (`.delivery.zones`):
- `fee`: `0` = free, number = delivery fee, `null` = "sur devis" / hors zone.
- A zone with empty `quartiers` **and** `fee: null` is treated as the hors-zone fallback and is **excluded** from the quartier `<select>` (`data.ts:findZoneForQuartier` / `getAllQuartiers`).

## Conventions (mandatory)

- Mark every code change with a comment:
  - `// NOUVEAU : [desc]` for new code
  - `// MODIFIÉ : [desc]` for changed code
- Comments and UI copy are in **French** (Malagasy market).
- Prices are in Ariary (`Ar`); the `€` figures in the legacy spec are wrong — trust `config.json`.
- TypeScript imports use the explicit `.js` extension (Node/ESM resolution, e.g. `import './pricing.js'`).
