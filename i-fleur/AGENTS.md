# AGENTS.md — i-fleur/

## What this is

**i.fleur** is a **monolith**: one Fastify server (`app/`) serves both the API
(`/api/*`) and the static frontend (`app/public/`). Prod target = serveur cPanel
(`node dist/server.cjs`), pas Netlify. La vue d'ensemble est dans le parent
`Ifleur/AGENTS.md` ; le doc `MIGRATION-PRIX-BACKEND.md` n'existe plus (spec achevée —
ses règles sont capturées ici et dans le parent). **Tous les calculs de prix sont côté serveur** — le frontend n'a aucun montant/arith.

## Layout (`app/`)

- `public/` — **racine web servie** : `index.html` (boutique), `paiement.html` (paiement), `src/styles|images|fonts`, `dist/app.js`. Seule partie exposée : jamais `src/`, `.env`, `package.json`.
- `src/app.ts` — ENTRYPOINT Fastify : `ensureFrontendBuilt()` (bundle esbuild src/ts/main.ts → public/dist/app.js, watch en dev) → CORS localhost → error handler (AppError + fallback 4xx/5xx) → routes `/api/*` → `@fastify/static` root=`public/` → SPA fallback (GET sans extension → index.html ; **404 réel** pour `/api/*`, fichiers à extension et dotfiles).
- `src/config/config.json` — **données business côté serveur** (prix, WhatsApp, shop, zones, FAQ), servies par `GET /api/config`. `src/ts/config.json` n'existe plus.
- `src/modules/` — **config** (GET /api/config), **email** (complet, EmailJS via `.env`), **order** (`POST /api/order/quote` + `POST /api/order`), **payment** (`POST /api/payment` — placeholder ; API externe à brancher à `// TODO API externe` dans `payment.service.ts`).
- `dist/server.cjs` — bundle serveur (`node dist/server.cjs`, entry cPanel).

## Flow commande (2 pages, même bundle)

1. Home `index.html` : configurateur → `pricing.ts` envoie la sélection à `POST /api/order/quote` (débouncé **150 ms**) et affiche le résultat serveur. **Aucun calcul local.**
2. « Paiement » → `payment.ts` valide, stocke `{ payload, quote }` dans `sessionStorage['ifleur_order']` → redirection `/paiement.html`.
3. `main.ts` détecte `#checkout-page` → `checkout.ts` re-quote au backend, récap, choix MVola/carte, « Payer » → `POST /api/order`. Le backend envoie l'email de confirmation au client (`billing.email`) via EmailJS.
4. WhatsApp = **contact uniquement** (plus de message de commande). Paiement : **MVola + carte seulement** (especes/sendwave supprimés).

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

Configuration servie par `GET /api/config` (`src/config/config.json`) ; chargée côté frontend par
`loadConfig()` (`data.ts`). Plus d'import JSON côté frontend : éditer `src/config/config.json` → rebuild.

**Prix** : seul `POST /api/order/quote` calcule (formule `total = basePrice + vasePrice + deliveryFee` ;
`custom` → `isDevis:true, total:null` ; hors-zone `fee:null` → `deliveryIsDevis:true, deliveryFee:0`).
Source de vérité = `config.json` serveur ; les montants `data-price-label` en dur dans `public/index.html`
sont un fallback pré-JS (écrasés ensuite par `renderPricesFromConfig()`) — les garder quand même en phase.
Prix (Ar) : Mini 80 000 · S 100 000 · M 120 000 · L 150 000 · vase +20 000 · sur-mesure min 200 000.

Zones livraison (`.delivery.zones`) : `fee: 0` = gratuit, `fee: N` = frais, `fee: null` = "sur devis"/hors zone ; zone `quartiers` vides + `fee: null` = fallback hors-zone, exclue du `<select>` quartier.

## Conventions (mandatory)

- Tout changement marqué `// NOUVEAU : [desc]` / `// MODIFIÉ : [desc]`.
- Commentaires & UI en **Français** (marché malgache), labels FR/EN bilingues OK.
- Prix en **Ariary (`Ar`)** — ignorer les € du pptx.
- Imports frontend avec extension `.js` (`import './pricing.js'`); imports serveur sans extension.
- Backend fourni en copier-coller et intégré par toi (règle du parent `AGENTS.md`) — jamais retouché sans consentement explicite.