# AGENTS.md — i-fleur/

## What this is

**i.fleur** is a **monolith**: one Fastify server (`app/`) serves both the API
(`POST /api/email/send` via EmailJS, clés privées côté serveur) and the static
frontend (`app/public/`). Prod target = serveur cPanel (`node dist/server.cjs`),
pas Netlify. La vue d'ensemble et l'historique prix sont dans le parent
`Ifleur/AGENTS.md` — trust ce fichier pour le code dans `app/`.

## Layout (`app/`)

- `public/` — **racine web servie** (index.html, `src/styles|images|fonts`, `dist/app.js`). Seule partie exposée : jamais `src/ts`, `.env`, `package.json`.
- `src/app.ts` — ENTRYPOINT Fastify : `ensureFrontendBuilt()` (bundle esbuild src/ts/main.ts → public/dist/app.js, watch en dev) → CORS localhost → error handler (AppError + fallback 4xx/5xx) → routes `/api/*` → `@fastify/static` root=`public/` → SPA fallback (GET sans extension → index.html ; **404 réel** pour `/api/*`, fichiers à extension et dotfiles).
- `src/buildStatic.ts` — contexte esbuild frontend (auto-build au démarrage).
- `src/modules/email/` — **complet** (dto/service/controller/route). `src/modules/payment/` — **stubs vides** à remplir plus tard.
- `src/ts/config.json` — **toutes les données business** (prix, WhatsApp, shop, zones, FAQ), baked dans le bundle.
- `dist/server.cjs` — bundle serveur (`node dist/server.cjs`, entry cPanel).

## Commands (run in `app/`)

```bash
npm install                  # esbuild + @fastify/static sont des DEPS (requis à l'exécution)
npm run dev                  # bundle esbuild watch + serveur :3000 (single command)
npm run build                # esbuild frontend minifié -> public/dist/app.js
npm run serve                # build + NODE_ENV=production tsx src/app.ts (une fois)
npm run build:server         # esbuild serveur -> dist/server.cjs (entry cPanel)
npx tsc --noEmit             # typecheck frontend only (no tests, no linter)
```

- `dev` = `tsx watch --ignore src/ts --ignore public src/app.ts` : tsx watch (back) + esbuild watch (front) sur une seule commande.
- `dist/` et `public/dist/` sont gitignorés — toujours rebuild avant test/déploy.
- ⚠️ **Jamais `pkill -f "tsx"`/`pkill -f "src/app.ts"`** dans un shell interactif : le pattern matche la commande elle-même → tue le shell. Tuer par port : `ss -tlnp | grep :3000`.

## Config data flow

Tout est dans `src/ts/config.json`, importé dans le bundle (`data.ts` → `CONFIG`). Aucun fetch : changement → éditer le JSON → rebuild.

**Pricing en 2 sources qui doivent rester synchronisées** : `src/ts/config.json` (seulement le total initial `basePrice = CONFIG.prices.S`, `vasePrice`, `surMesureMin`) et `public/index.html` (`data-price` sur boutons taille/vase + montants `c-label`). Désaccord ⇒ total/récap dérivent. Prix (Ar) : Mini 100 000 · S 80 000 · M 120 000 · L 150 000 · vase +20 000 · sur-mesure min 200 000.

> ⚠️ Divergence non commitée : `public/index.html` affiche Mini 80 000 / S 100 000 alors que `config.json` dit l'inverse. À trancher avant tout `POST /api/order`.

Zones livraison (`.delivery.zones`) : `fee: 0` = gratuit, `fee: N` = frais, `fee: null` = "sur devis"/hors zone ; zone `quartiers` vides + `fee: null` = fallback hors-zone, exclue du `<select>` quartier.

## Conventions (mandatory)

- Tout changement marqué `// NOUVEAU : [desc]` / `// MODIFIÉ : [desc]`.
- Commentaires & UI en **Français** (marché malgache), labels FR/EN bilingues OK.
- Prix en **Ariary (`Ar`)** — ignorer les € du pptx.
- Imports frontend avec extension `.js` (`import './pricing.js'`); imports serveur sans extension.