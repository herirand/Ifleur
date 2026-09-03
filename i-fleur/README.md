# i.fleur - Boutique en ligne de fleurs

Site vitrine pour la boutique i.fleur à Antananarivo, Madagascar. **100% statique** (frontend TypeScript + esbuild), commande via WhatsApp. Déployable gratuitement sur Netlify.

## Architecture

```
i-fleur/
└── frontend/              # Site statique (TypeScript + CSS)
    ├── src/
    │   ├── ts/            # Modules TypeScript + config.json (prix, zones, FAQ)
    │   ├── styles/        # CSS séparé par section
    │   └── images/        # Images locales
    ├── index.html
    └── dist/              # Build esbuild (dist/app.js)
```

> L'ancien backend Fastify (non déployé) a été archivé hors du repo : `../ifleur-archive/`.

## Installation & lancement

```bash
cd frontend
npm install
npm run dev        # bundle esbuild + serveur sur http://localhost:8000 (une seule commande)
```

Build de production :

```bash
cd frontend
npm run build      # esbuild minifié → dist/app.js
```

## Configuration

Tout se passe dans **`src/ts/config.json`** (embarqué dans le bundle, aucun appel réseau) :

- **prices** : prix des bouquets (S, M, L)
- **vasePrice** : prix du vase (+8 000 Ar)
- **whatsappNumber** : numéro WhatsApp pour commandes
- **shop** : nom, adresse, horaires, Instagram/Facebook
- **delivery.zones** : zones de livraison (liste de quartiers + frais ; `fee` 0 = gratuit, `null` = sur devis/hors zone). **Ajouter un quartier :** éditer ce fichier puis `npm run build` + redeploy.
- **faq** : questions/réponses

## Fonctionnalités

- Sélection taille/couleur/vase
- Calcul du total en temps réel (produit + vase + frais de livraison par quartier)
- Retrait en boutique ou livraison à domicile
- Coordonnées de facturation + récapitulatif
- Commande via WhatsApp (message pré-rempli)
- Paiement MVola, espèces, Sendwave/PayPal
- FAQ interactive
- Design responsive (mobile/tablet/desktop)

## Stack technique

- **Frontend** : TypeScript, CSS3, esbuild
- **Aucun backend** en production — zéro serveur, zéro dépendance runtime