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
- `src/modules/` — **config** (GET /api/config), **order** (`POST /api/order/quote` + `POST /api/order`), **email** (service + dto seuls, plus de route : appelé par `order.service`), **payment** (service + dto seuls, plus de route). Chaque module = `service / controller / route / dto` ; seuls `config` et `order` sont enregistrés dans `src/routes/routes.ts` sous le préfixe `/api`.
- `dist/server.cjs` — bundle serveur (`node dist/server.cjs`, entry cPanel).
- `AppError` = **`new AppError(statusCode, message, code?)`** — le statut en PREMIER argument (`src/lib/appError.ts`), sérialisé `{ statusCode, error: code, message }`.

## Pièges (vérifiés)

- **cwd = racine de `app/`.** `PUBLIC_DIR = process.cwd()/public`, l'entrée esbuild `src/ts/main.ts` et `.env` en dépendent. `node dist/server.cjs` lancé ailleurs = racine web vide + serveur qui ne démarre pas.
- **`src/config/config.json` est un `import` statique, pas une lecture `fs`** (`config.service.ts`, `order.service.ts`) : esbuild l'inline dans le bundle. Modifier les prix ⇒ **`npm run build:server` obligatoire**, sinon cPanel sert les anciens.
- **`npm run typecheck` ne couvre que le frontend** : `tsconfig.json` a `include: ["src/ts/**/*"]` ⇒ `src/app.ts` et tout `src/modules/` ne sont **jamais** typecheckés (erreurs visibles seulement à l'exécution / au bundle).
- **`dist/` et `public/dist/` sont gitignorés** mais présents sur le disque = artefacts périmés. Rebuild avant de tester/déployer.
- **`ensureFrontendBuilt()` bloque le démarrage** (awaité avant `app.listen`) ; un build en échec ⇒ `process.exit(1)`.
- **`.env` non commité, `.env.example` inexistant** : 4 clés `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`. Le serveur **démarre sans elles** — l'échec n'apparaît qu'à la commande (`500 EMAILJS_CONFIG_MISSING`) : chaque commande client 500 alors que le site semble sain. L'échec d'email **n'est pas avalé** : il annule la commande (ni file, ni retry) ⇒ une panne EmailJS perd des commandes en silence.
- `POST /api/email/send` (relais de mail public non authentifié, jamais appelé par le front) a été **supprimé** — ne pas le réintroduire. `email.service.ts` + `SendEmailDto` doivent rester : `order.service.ts` en dépend.

## Flow commande (2 pages, même bundle)

1. Home `index.html` : configurateur → `pricing.ts` envoie la sélection à `POST /api/order/quote` (débouncé **150 ms**) et affiche le résultat serveur. **Aucun calcul local.**
2. « Paiement » → `payment.ts` valide, stocke `{ payload, quote }` dans `sessionStorage['ifleur_order']` (seule clé ; `paymentMethod` n'y est **pas**, ajouté sur la page paiement) → redirection `/paiement.html`.
3. `main.ts` détecte `#checkout-page` → `checkout.ts` re-quote au backend, récap, choix MVola/carte, « Payer » → `POST /api/order` (+ `sessionStorage.removeItem`). Le backend envoie l'email de confirmation au client (`billing.email`) via EmailJS.
4. « Modifier » → retour `/`, et `restore.ts` (`restoreSelection()`, appelé par `main.ts:23`) réapplique le payload stocké sur le configurateur ; `delivery.ts` (`initDelivery()`) possède l'état `deliveryMode`/`selectedQuartier` et alimente le `<select>` des quartiers.
5. ⚠️ `main.ts` fait `initSlider()`, puis `loadConfig().catch(...).then(initCheckout)` sur la page paiement, puis **retourne**. Avant, ce chemin n'appelait jamais `loadConfig()` et tout `getConfig()` y levait `'Configuration non chargée'` (`data.ts:19`) : le piège est **corrigé**, `loadConfig()` y est appelé avec un `.catch` pour que la page démarre même si l'API tombe (au prix du seul lien WhatsApp vide).
7. **Carrousel (`slider.ts`, partagé par les 2 pages)** : crossfade piloté par la seule classe `active` ; aucune modif CSS/HTML nécessaire pour lui ajouter un comportement. Il **défile tout seul toutes les 4 s** (`AUTOPLAY_MS`) et garde la navigation manuelle. Chaque saut manuel appelle `syncAutoplay()` derrière, qui relance un cycle complet de 4 s. `syncAutoplay()` est l'unique autorité play/pause, gardée par 3 drapeaux : `hovered` (lié à `.col-photo`, **pas** `#slider` — les flèches et les puces en sont des *sœurs*, un `mouseenter` sur `#slider` ne se déclencherait jamais sur un bouton), `docHidden` (`visibilitychange`) et `reducedMotion` (`prefers-reduced-motion`, qui coupe l'autoplay alors que la navigation manuelle reste). Un clic pendant le survol ne relance volontairement rien, sinon impossible de figer une photo.

⚠️ Le fondu est de **0.5 s**, écart assumé par rapport au `speed: 100` de saison-eshop. Mesuré : à 100 ms le crossfade ne couvrait que 6 frames et se lisait comme une coupe sèche. Mesuré sur la version 0.5 s : frame médiane et p99 = 16,7 ms (60 fps), ~1 frame perdue par transition. Les 4 photos sont **chargées ensemble** au chargement de la page (~0,9 s), et *non* par diapo : une diapo n'est donc jamais vide — ne pas « optimiser » en chargement paresseux, cela créerait exactement le bug de frame vide. Le `translateZ(0)` + `backface-visibility: hidden` sur `.slide` est une astuce de promotion GPU dont le gain n'a **pas** pu être isolé en A/B ici (Chrome rendu en logiciel) : c'est un standard peu risqué, pas un gain prouvé.
6. Deux liens WhatsApp distincts, à ne pas confondre : `#btn-whatsapp` (home) = **contact uniquement**, sans payload de commande ; `#co-wa-proof` (page paiement, dans le box MVola) = **demande de capture de paiement**, message pré-rempli par `initWhatsappProof()` avec `whatsappNumber` (config) et le **montant du quote serveur**. Ne jamais le supprimer en croyant réintroduire une fuite de commande : c'est la seule preuve de paiement demandée au client. Paiement : **MVola + carte seulement** (`PaymentMethod = 'Mvola' | 'carte'`, `types-payment.ts:2`).

DOM : ne pas renommer `#checkout-page`, `#total-display`, `#btn-checkout`, `#order-status`, `#size-row .c-btn[data-size] .c-label`, `#quartier-select`, `#delivery-fee-info`, `#co-total-display`, `.r-btn[data-pay]`, `#btn-pay`, `#co-wa-proof`, ni les champs `.card-input` — le TS les requête en direct et toggle
une classe `.error` dessus à l'exécution (`.error` n'est jamais dans le HTML, ne pas l'ajouter).

## Commands (run in `app/`)

```bash
npm install                  # esbuild + @fastify/static sont des DEPS (requis à l'exécution)
npm run dev                  # bundle esbuild watch + serveur :3000 (single command)
npm run build                # esbuild frontend minifié -> public/dist/app.js
npm run start                # NODE_ENV=production tsx src/app.ts (le serveur rebuild le bundle front au boot)
npm run serve                # build + start (une fois, pas de watch)
npm run build:server         # esbuild serveur -> dist/server.cjs (entry cPanel)
npm run typecheck            # tsc --noEmit — FRONTEND UNIQUEMENT (cf. pièges)
```

- `dev` = `tsx watch --ignore src/ts --ignore public src/app.ts` : tsx watch (back) + esbuild watch (front) sur une seule commande.
- **Aucun test, aucun linter, aucun formatter, aucune CI.** Vérif = `npm run typecheck && npm run build:server`, puis `npm run dev` + `curl localhost:3000/api/config` et `curl -X POST localhost:3000/api/order/quote -H 'content-type: application/json' -d '{"size":"M","vase":true,"deliveryMode":"home","quartier":"Alarobia"}'`, puis ouvrir `/` et `/paiement.html`.
- `POST /api/order` exige `size, vase, color, deliveryMode, billing{nom,tel,email}, paymentMethod` ; `paymentMethod` = `'Mvola'` (M majuscule) ou `'carte'` ; props inconnues rejetées.
- Déploiement cPanel : `git pull` sur l'hôte puis `npm ci && npm run build:server && node dist/server.cjs` (le serveur rebuild le bundle front au boot ; `npm run build` inutile là-bas).
- ⚠️ **Jamais `pkill -f "tsx"`/`pkill -f "src/app.ts"`** dans un shell interactif : le pattern matche la commande elle-même → tue le shell. Tuer par port : `ss -tlnp | grep :3000`.

## Config data flow

Configuration servie par `GET /api/config` (`src/config/config.json`) ; chargée côté frontend par
`loadConfig()` (`data.ts`). Plus d'import JSON côté frontend : éditer `src/config/config.json` → rebuild.

**Prix** : seul `computeQuote()` (`order.service.ts:31`) calcule, appelé par **les deux** endpoints
(`quoteHandler` **et** `createOrder` — une commande soumise est donc toujours re-tarifée côté serveur).
Formule : `total = basePrice + vasePrice + deliveryFee`.
- `isDevis` / `total: null` — **uniquement** pour `size: 'custom'`.
- `deliveryIsDevis` — `deliveryMode: 'home'` + quartier hors zone ou zone à `fee: null`. ⚠️ Ça **ne met pas** le total à `null` : une commande hors zone garde un total numérique avec `deliveryFee: 0` et elle est acceptée. « Sur devis » ≠ « pas de total ».
- `surMesureMin` (200 000 Ar) n'est **jamais appliqué** — texte d'affichage seul ; `custom` price toujours 0.

Source de vérité = `config.json` serveur ; les montants en dur dans `public/index.html`
sont un fallback pré-JS (écrasés par `renderPricesFromConfig()`, qui cible la classe `.c-label`) — les garder
en phase quand même (`#total-display` vaut `—` : y afficher `80 000 Ar` était faux, la taille par défaut
étant S = 100 000).
Prix (Ar) : Mini 80 000 · S 100 000 · M 120 000 · L 150 000 · vase +20 000 · sur-mesure min 200 000.

Zones livraison (`.delivery.zones`) : A Centre-ville (25 quartiers) et B Première couronne (9) en `fee: 0` ;
C Périphérie (13) et D Grande périphérie (3) en `fee: 20000` ; `"Autre / hors zone"` = `quartiers: []` +
`fee: null`, **fallback hors zone** — exclue du `<select>` mais utilisée par `findZoneForQuartier()` côté
serveur ET front (`data.ts:24`). Matching de quartier : exact, insensible à la casse.

## Problèmes connus (ne pas « redécouvrir »)

- **Paiement jamais vérifié côté serveur** : `createOrder()` valide la méthode puis envoie l'email —
  il n'appelle aucune API de paiement. Un `POST /api/order` avec `paymentMethod: 'Mvola'` produit une
  commande confirmée sans aucun contrôle. L'intégration réelle va au marqueur `// TODO API externe`
  dans `createOrder()`. (`POST /api/payment` et son stub `processPayment()` ont été supprimés : le
  stub renvoyait `status:'pending'` en dur ; `validatePaymentMethod` + `PAYMENT_LABEL` restent vivants.)
- **Ni persistance, ni idempotence, ni rate limiting** : un `POST /api/order` rejoué renvoie un 2e mail ;
  un flood sature le quota EmailJS.
- **Validation DTO mince** : pas de `format: 'email'`, pas de `maxLength`, `recipient` sans sous-champs
  requis, `deliveryMode: 'home'` n'exige ni `recipient`, ni `deliveryDate`, ni `quartier`.

## Nettoyage effectué (ne pas réintroduire)

`tsc --noEmit --noUnusedLocals --noUnusedParameters` = **0 erreur**, c'est la porte anti-code-mort.
`setText()` dans `utils.ts` est le helper id→textContent unique (existait en 3 copies) et `ORDER_COLORS`
dans `types.ts` la liste de couleurs unique. `PAYMENT_METHODS` dans `payment/payment.dto.ts` est la
source unique des méthodes de paiement. La logique de zone de livraison n'existe **que** côté serveur :
la copie `findZoneForQuartier` du front a été supprimée.

## Conventions (mandatory)

- Tout changement marqué `// NOUVEAU : [desc]` / `// MODIFIÉ : [desc]`.
- Commentaires & UI en **Français** (marché malgache), labels FR/EN bilingues OK.
- Prix en **Ariary (`Ar`)** — ignorer les € du pptx.
- Imports frontend avec extension `.js` (`import './pricing.js'`); imports serveur sans extension.
- Backend fourni en copier-coller et intégré par toi (règle du parent `AGENTS.md`) — jamais retouché sans consentement explicite.