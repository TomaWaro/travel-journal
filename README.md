# Travel Journal

Application web de carnet de voyage mobile-first, pensée pour publier au fil du trajet des photos, vidéos, notes, positions GPS et commentaires publics, puis les partager via une page quasi-publique.

Ce document sert de guide de reprise complet pour un autre agent ou un autre développeur. Il couvre:

- l’objectif produit
- l’état actuel du produit
- l’architecture technique
- le stockage et les services externes
- le déploiement GitHub + Vercel
- les variables d’environnement
- la structure du code
- les points subtils et les zones encore héritées de versions précédentes

## Statut du projet

Le projet est actif et déployé.

Références importantes:

- Repo GitHub: `https://github.com/TomaWaro/travel-journal`
- Workspace local utilisé ici: `/Users/thoarau/Documents/DEV/codex/vacances`
- Déploiement Vercel de production mentionné dans l’historique du projet: `https://travel-journal-henna-iota.vercel.app`

Le code a beaucoup évolué. À date, l’application est simplifiée autour de:

- une capture rapide de moments depuis mobile
- une page publique de voyage
- une galerie horizontale cliquable
- une carte avec points GPS et noms de lieux
- une timeline
- des commentaires publics sans compte

Des restes de l’ancien flux éditorial existent encore côté backend et dans certains fichiers, mais ils ne sont plus au cœur du produit.

## Vision produit

L’application sert à documenter un voyage en temps réel:

1. le propriétaire crée un voyage
2. lui ou ses contributeurs ajoutent des moments depuis leur téléphone
3. chaque moment est publié immédiatement
4. la page publique du voyage montre:
   - un en-tête simple
   - une galerie horizontale auto-scroll
   - une carte
   - une timeline
   - des commentaires publics
5. chaque image peut être ouverte en grand et commentée individuellement

Le mode public est “quasi-public”: le voyage est consultable, mais l’admin reste privée via un token.

## Fonctionnement produit actuel

### 1. Dashboard privé

Route:

- `/access/[token]`

Le dashboard privé sert à:

- capturer des moments
- voir la carte du voyage
- voir la timeline
- régler le voyage
- gérer les étapes Google Maps
- générer des liens d’invitation contributeur

Le dashboard n’expose plus l’onglet éditorial dans le flux principal.

### 2. Capture de moment

Depuis le dashboard, l’utilisateur peut:

- uploader une photo / vidéo / audio
- écrire une légende
- écrire une note
- attacher sa position GPS
- démarrer un suivi GPS continu

Important:

- les moments sont désormais créés avec `status: "published"` immédiatement
- ils deviennent donc visibles sans étape de validation éditoriale

### 3. Voyage public

Route:

- `/t/[slug]`

Affiche:

- un header très simple: titre, résumé, journée en cours
- une galerie horizontale animée
- une carte MapLibre
- une timeline jour par jour
- des commentaires publics sur le voyage

### 4. Visionneuse photo

Depuis la galerie publique:

- clic sur une image
- ouverture d’une visionneuse plein écran
- image visible en grand
- navigation précédente / suivante
- commentaires liés à cette image
- formulaire pour ajouter un commentaire à cette image

### 5. Commentaires publics

Les visiteurs peuvent commenter:

- le voyage
- une image / un moment
- un récit publié existant si on visite encore les routes `/posts/[slug]`

Sans compte, uniquement avec:

- un nom
- un message

## Stack technique

- Next.js 16 App Router
- React 19
- TypeScript
- CSS global custom, pas de Tailwind
- Vercel pour le hosting
- Neon Postgres pour la persistance principale
- Vercel Blob pour les médias
- Redis / Upstash Redis pour le cache court terme du tracking GPS
- fallback local JSON quand Postgres n’est pas configuré

## Architecture générale

Le projet supporte deux modes de stockage:

### Mode 1. Stockage local fichier

Utilisé en dev local ou en fallback.

Fichier principal:

- `data/travel-journal.json`

Implémentation:

- `lib/stores/file-store.ts`

### Mode 2. Stockage Postgres

Utilisé en environnement Vercel / production quand `DATABASE_URL` est présent.

Implémentation:

- `lib/stores/postgres-store.ts`
- `lib/postgres.ts`

### Sélection du store

Fichier:

- `lib/store.ts`

Règle:

- si `DATABASE_URL` existe et `USE_FILE_STORE !== "true"`, alors store Postgres
- sinon store fichier local

## Dépendances externes et rôle de chacune

### GitHub

Le source of truth du code est GitHub:

- repo: `TomaWaro/travel-journal`

Le flux utilisé jusqu’ici:

- modifications locales
- `pnpm lint`
- `pnpm build`
- commit
- `git push origin main`
- Vercel redéploie depuis GitHub

### Vercel

Vercel héberge:

- l’application Next.js
- le Blob store pour les fichiers médias
- potentiellement l’intégration Neon
- potentiellement l’intégration Redis / Upstash

Subtilité importante:

- l’app est pensée pour être pilotée depuis Vercel en prod
- plusieurs variables d’environnement sont injectées via intégrations Vercel

### Neon Postgres

Rôle:

- persistance durable des voyages, moments, liens, commentaires, tracking, etc.

Schéma:

- `db/migrations/0001_initial.sql`
- `db/migrations/0002_public_comments.sql`
- `db/migrations/0003_public_comment_moments.sql`

### Vercel Blob

Rôle:

- stockage des photos / vidéos / audios

Flux:

1. le navigateur upload vers Blob
2. la route Next persiste ensuite la référence de l’asset
3. le moment utilise l’asset stocké

### Redis / Upstash

Rôle:

- cache court terme pour le tracking GPS actif

Ce n’est pas la base principale. Redis sert d’optimisation / support pour l’état live.

## Variables d’environnement

Voir aussi `.env.example`.

Variables importantes:

- `DATABASE_URL`
- `USE_FILE_STORE`
- `NEXT_PUBLIC_APP_URL`
- `OWNER_ACCESS_TOKEN`
- `BLOB_READ_WRITE_TOKEN`
- `BLOB_STORE_ID`
- `BLOB_WEBHOOK_PUBLIC_KEY`
- `REDIS_URL`
- ou `UPSTASH_REDIS_REST_URL`
- ou `UPSTASH_REDIS_REST_TOKEN`

Subtilités:

- Blob peut fonctionner soit avec `BLOB_READ_WRITE_TOKEN`, soit avec `BLOB_STORE_ID` + `BLOB_WEBHOOK_PUBLIC_KEY`
- Redis peut fonctionner soit avec `REDIS_URL`, soit avec la paire Upstash REST
- en prod, le token owner privé doit être différent des tokens de démo

## Lancement local

### Prérequis

- Node `>=20.9.0`
- `pnpm` recommandé

### Installation

```bash
pnpm install
cp .env.example .env.local
pnpm seed
pnpm dev
```

Scripts disponibles:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm seed
```

### Tokens de démo en local

- owner: `/access/owner-demo-token`
- contributor: `/access/son-demo-token`

Important:

- les tokens de démo sont rejetés en production
- en production, il faut utiliser `OWNER_ACCESS_TOKEN`

## Déploiement

### Déploiement GitHub -> Vercel

Le workflow attendu est:

1. pousser le code sur GitHub
2. Vercel importe ou surveille le repo `TomaWaro/travel-journal`
3. Vercel injecte les variables d’environnement
4. Vercel build et déploie l’app

### Ce qu’un autre agent doit savoir

- ne pas supposer que le store local reflète la prod
- la prod utilise probablement Neon + Blob + Redis
- toute modif backend doit être compatible à la fois avec:
  - `file-store`
  - `postgres-store`
- les migrations SQL doivent être ajoutées dans `db/migrations/`
- `lib/postgres.ts` doit connaître la nouvelle migration dans `migrationFiles`

## Structure du projet

### `app/`

Routes Next.js App Router.

Fichiers principaux:

- `app/layout.tsx`
  - layout racine
  - enregistre le service worker
  - charge les fonts
  - ne rend plus le header/footer globaux

- `app/page.tsx`
  - homepage du produit
  - encore partiellement marquée par l’ancienne logique éditoriale

- `app/t/[slug]/page.tsx`
  - page publique d’un voyage
  - c’est aujourd’hui la page la plus importante côté utilisateur final

- `app/posts/[slug]/page.tsx`
  - ancienne page “récit / story”
  - encore fonctionnelle mais moins centrale après simplification du produit

- `app/access/[token]/page.tsx`
  - dashboard privé

### `app/api/`

Routes API server-side.

Routes importantes:

- `app/api/trips/[tripId]/moments/route.ts`
  - création d’un moment
  - publication immédiate via le store

- `app/api/trips/[tripId]/moments/upload`
  - gestion upload Blob

- `app/api/trips/[tripId]/comments/route.ts`
  - commentaires de voyage

- `app/api/moments/[momentId]/comments/route.ts`
  - commentaires liés à une image / un moment

- `app/api/track-sessions/*`
  - suivi GPS live

Routes héritées encore présentes:

- `app/api/trips/[tripId]/drafts/route.ts`
- `app/api/drafts/[draftId]/route.ts`
- `app/api/drafts/[draftId]/publish/route.ts`
- `app/api/published-stories/[storyId]/route.ts`
- `app/api/published-stories/[storyId]/comments/route.ts`

Elles ne sont plus au centre du produit, mais elles existent encore.

### `components/`

Composants UI principaux.

- `capture-panel.tsx`
  - formulaire mobile-first pour ajouter un moment
  - support Blob + GPS

- `dashboard-shell.tsx`
  - shell privé avec onglets
  - l’onglet éditorial a été retiré du flux principal

- `photo-grid.tsx`
  - galerie horizontale
  - visionneuse photo plein écran
  - intégration commentaires par photo

- `public-comments-panel.tsx`
  - formulaire + liste de commentaires publics
  - peut fonctionner pour voyage, story, ou moment

- `map-panel.tsx`
  - rendu MapLibre
  - affiche:
    - route planifiée
    - route réelle
    - points des moments
    - labels de ville déduits pour les moments géolocalisés

- `timeline-panel.tsx`
  - timeline publique ou privée
  - aujourd’hui recentrée surtout sur les moments

Composants encore présents mais désormais secondaires / hérités:

- `editorial-panel.tsx`
- `article-card.tsx`
- `quote-block.tsx`
- `site-header.tsx`
- `site-footer.tsx`

Ils peuvent être supprimés ou simplifiés davantage dans une future passe si on assume que le produit n’a plus de couche “récits”.

### `lib/`

Logique métier et accès aux données.

- `lib/types.ts`
  - types centraux
  - important pour toute reprise

- `lib/store.ts`
  - façade du store
  - choisit entre file store et postgres store

- `lib/stores/file-store.ts`
  - implémentation locale JSON

- `lib/stores/postgres-store.ts`
  - implémentation prod Postgres

- `lib/postgres.ts`
  - initialisation DB
  - exécution migrations
  - seed initial

- `lib/public-view.ts`
  - règles de filtrage pour le public
  - ex: masque selon statut, applique délai de carte

- `lib/google-maps.ts`
  - parsing best effort des liens Google Maps

- `lib/tracking-cache.ts`
  - logique Redis pour les sessions GPS actives

- `lib/server-access.ts`
  - validation accès dashboard / trip

- `lib/access.ts`
  - logique tokens owner / démo / prod

### `db/`

Migrations SQL.

- `0001_initial.sql`
  - schéma de base

- `0002_public_comments.sql`
  - commentaires publics

- `0003_public_comment_moments.sql`
  - commentaires attachés à un moment / image

### `data/`

- `seed.travel-journal.json`
  - seed de base pour initialiser une DB vide

- `travel-journal.json`
  - store local courant

### `scripts/`

Scripts utilitaires:

- `reset-local-state.mjs`
  - recharge le store local depuis la seed

- `reset-empty-state.mjs`
  - remet un état vide local

- `reset-postgres-empty-state.mjs`
  - purge l’état de voyage dans Postgres

## Modèle de données

Entités importantes:

- `Workspace`
- `Member`
- `Trip`
- `RouteLeg`
- `Asset`
- `Moment`
- `TrackSession`
- `TrackPoint`
- `PublicComment`

Entités héritées encore présentes:

- `DraftStory`
- `PublishedStory`

Important:

- `Moment.status` est utilisé pour contrôler la visibilité publique
- aujourd’hui, un moment est créé directement en `published`

### Commentaires

Un `PublicComment` peut cibler:

- un voyage via `tripId`
- un récit via `storyId`
- un moment / image via `momentId`

Dans l’état actuel du produit, le commentaire par `momentId` est la mécanique la plus utile côté UX.

## Carte et tracking

### Carte

La carte publique et privée repose sur `MapLibre`.

Affichages:

- ligne planifiée depuis les `RouteLeg`
- ligne réelle depuis les `TrackPoint`
- points des moments géolocalisés
- labels de lieux proches des moments

Subtilité:

- le nom de ville affiché pour un moment n’est pas un reverse geocoding externe
- il est déduit à partir:
  - des étapes connues du voyage
  - d’une petite table de lieux connus dans `components/map-panel.tsx`

### Tracking

Le suivi GPS:

- démarre côté navigateur
- envoie des points régulièrement à l’API
- peut être filtré publiquement selon:
  - délai (`delayed`)
  - ou segments terminés (`completed-only`)

Fichiers clés:

- `components/capture-panel.tsx`
- `app/api/track-sessions/*`
- `lib/public-view.ts`
- `lib/tracking-cache.ts`

## Upload média

Flux recommandé en prod:

1. l’utilisateur choisit un fichier
2. le front envoie le fichier vers Vercel Blob
3. le back persiste un `Asset`
4. le moment référence cet asset

Subtilité:

- en local sans Blob, il existe un fallback fichier
- en prod Vercel sans Blob configuré, l’upload média échoue volontairement

## Ce qui est encore “legacy”

Le projet a eu plusieurs itérations. Certaines couches existent encore alors qu’elles ne sont plus prioritaires:

- génération de brouillons
- publication de récits
- page `/posts/[slug]`
- composants éditoriaux

Ces éléments ne doivent pas être supprimés à l’aveugle si la base de prod contient encore des données liées. Mais ils peuvent être sortis du produit si une future passe de nettoyage est décidée.

## Conventions de reprise pour un autre agent

Si un autre agent reprend le projet, il doit:

1. lire ce README en entier
2. vérifier quel store est réellement utilisé
3. vérifier les variables Vercel en prod
4. vérifier si des données `draft_stories` / `published_stories` existent encore en base
5. exécuter avant push:
   - `pnpm lint`
   - `pnpm build`

Règles pratiques:

- toute évolution de persistance doit être faite dans:
  - `lib/stores/file-store.ts`
  - `lib/stores/postgres-store.ts`
- toute migration Postgres doit être:
  - ajoutée dans `db/migrations/`
  - enregistrée dans `lib/postgres.ts`
- ne pas supposer que la page publique et le dashboard ont les mêmes besoins
- la cible principale UX est mobile

## État fonctionnel actuel à retenir

À date, le cœur réel de l’application est:

- admin privé par token
- capture immédiate de moments publiés
- partage d’un voyage public
- galerie défilante cliquable
- commentaires par photo
- carte avec points et labels
- timeline

Le reste est secondaire ou historique.

## Vérifications recommandées après toute modif

```bash
pnpm lint
pnpm build
```

Et en plus, idéalement:

1. tester `/access/<owner-token>`
2. ajouter un moment depuis mobile
3. ouvrir `/t/<trip-slug>`
4. cliquer une image
5. poster un commentaire image
6. vérifier la carte
7. vérifier la timeline

## Contact avec l’historique du projet

Le projet a été piloté de manière très itérative, avec beaucoup de retouches visuelles et produit. Le code n’est donc pas “greenfield propre”, il contient encore:

- des traces de design antérieur
- des routes encore utiles mais moins centrales
- des composants dont le rôle a diminué

Il faut raisonner en “état réel du produit” plutôt qu’en “intention initiale”.
