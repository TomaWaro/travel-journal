## Why

Le besoin initial était un carnet de voyage familial réutilisable pour l’été 2026. Le produit a depuis été implémenté, testé, simplifié, puis recentré sur l’usage réel: capturer vite depuis un téléphone, publier immédiatement, montrer le voyage publiquement avec une galerie, une carte, une timeline, et ouvrir les réactions sans compte.

Les artefacts OpenSpec d’origine ne reflétaient plus l’état réel du produit. Ils décrivaient encore fortement un flux éditorial à brouillons manuels, alors que l’application a été simplifiée vers un modèle plus direct, plus mobile et plus public.

## What Changed

- Build a reusable travel journal web application centered on workspaces, trips, contributors, route legs, moments, GPS tracks, and public comments.
- Support phone-first capture of photos, videos, audio, text notes, Google Maps route intent, and geolocated moments.
- Publish moments immediately on creation instead of routing the main product through a daily draft validation workflow.
- Expose a quasi-public trip page with:
  - a simplified header
  - a horizontal auto-scrolling gallery
  - a click-to-open fullscreen viewer
  - image-level comments
  - a map with route + moment points
  - a timeline grouped by day
- Keep the application reusable for future trips and other contributors instead of hard-coding the July 2026 trip.
- Use a Vercel-compatible deployment architecture backed by GitHub, Neon Postgres, Vercel Blob, and Redis.

## Capabilities

### New Capabilities

- `trip-management`: Create and manage reusable trips, route legs, contributors, visibility, and access tokens.
- `journey-capture`: Capture media, notes, route context, and GPS positions from phones with minimal friction.
- `journey-map`: Display planned route legs, actual traveled path, geolocated moments, and derived place labels on a trip map.
- `public-journey-view`: Render a shareable trip page with a simplified header, horizontal gallery, map, timeline, and public reactions.
- `public-comments`: Allow visitors to comment quickly without account creation at the trip level and image/moment level.

### Modified Capabilities

- `story-publication`: The original manual editorial flow still exists in the codebase, but it is no longer the primary surface or primary user workflow. The main product now favors immediate moment publication and public trip consumption.

## Impact

- The public trip page is now the main storytelling surface rather than a blog-like stack of generated recaps.
- The admin experience is simpler and more task-oriented, with capture as the most important flow.
- The storage model still supports drafts and published stories, but those concepts are now legacy/secondary compared to public moments.
- The project is already deployed through GitHub and Vercel and has working integrations for Postgres, Blob, and Redis-compatible tracking state.
