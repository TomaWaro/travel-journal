## Context

The repository started as an OpenSpec-only workspace. It is now a working Next.js application deployed from GitHub to Vercel and connected to external services. The original design intent emphasized a strong editorial review flow; the product has since been simplified around real-world mobile use during an active trip.

The current application must be understood as a reusable travel journal platform with one practical priority:

- capture fast from phones
- publish moments immediately
- let the public follow the trip through visuals, map, and timeline

Key product constraints that still matter:

- administration remains private via tokenized access
- the public journey page is quasi-public
- contributors can add moments from phones
- media and trip data must be durable
- route display must work without depending on Google Maps rendering
- mobile UX matters more than heavy editorial structure

## Goals / Non-Goals

**Goals**

- Support multiple reusable trips in one workspace.
- Support owner and contributor access from phones.
- Persist moments, assets, route legs, tracking data, and comments durably.
- Make the public trip page the primary storytelling surface.
- Allow direct public interaction through frictionless comments.
- Keep the architecture aligned with Vercel hosting and GitHub source control.

**Non-Goals**

- Building a native app.
- Guaranteeing native-grade background GPS tracking.
- Running a generic editorial CMS as the center of the product.
- Turning the app into a full public travel social network.

## Decisions

### 1. Keep one application with a private dashboard and a public journey page

The product remains a single Next.js application with:

- a private token-based dashboard for owner/contributor usage
- a public trip page for viewers
- legacy story routes still supported but no longer central

This keeps deployment simple on Vercel while preserving role separation.

### 2. Keep Next.js on Vercel as the deployment model

The application is deployed from GitHub to Vercel. This remains the correct stack because it provides:

- server-rendered public pages
- API routes for moments, comments, tracking, uploads
- clean routing for `/access/[token]`, `/t/[slug]`, `/posts/[slug]`
- easy binding to Vercel Blob and Neon

### 3. Keep split persistence concerns: Postgres, Blob, Redis

Durable domain records belong in Neon Postgres:

- trips
- members
- route legs
- moments
- track sessions
- track points
- comments
- legacy drafts/stories

Media belongs in Vercel Blob.

Short-lived tracking/session cache belongs in Redis.

This split is already implemented and remains valid.

### 4. Public storytelling is now moment-first, not draft-first

The most important evolution from the original design is product simplification:

- `Moment` creation now sets `status = "published"` directly
- the public journey page reads from published moments
- the gallery and timeline are now the primary narrative surfaces
- story drafts/published stories remain in the codebase but are not the main workflow anymore

Trade-off:

- less editorial control
- much faster real-world publishing flow
- closer alignment with how the product is actually used during a trip

### 5. The gallery is now a live visual strip with per-image interaction

The gallery is not a grid of article cards anymore. It is a horizontal auto-scrolling strip:

- visually dominant
- highly mobile-friendly
- every item clickable
- each image opens a dedicated fullscreen viewer
- comments can be attached directly to the viewed moment

This is closer to the intended “Instagram-like” interaction model than the earlier editorial grid.

### 6. Public comments are attached to multiple surfaces

The comment model supports three scopes:

- trip-level comment
- story-level comment
- moment-level comment

The moment-level comment is now the most important public interaction mode.

This required extending the schema with `moment_id` on public comments.

### 7. Map labels should explain where moments happened

The map does not rely on external reverse geocoding services. Instead, labels are inferred from:

- route leg endpoints
- a small known-places list in code

This keeps the map cheap and portable while still improving human readability.

### 8. Keep legacy editorial code for now, but treat it as transitional

The codebase still contains:

- draft story generation
- story publishing
- story pages
- editorial components and APIs

These are no longer central to product behavior, but they have not been fully removed because:

- they may still exist in production data
- removing them safely is a separate cleanup step

This is a deliberate transitional state.

## Risks / Trade-offs

- [Publishing moments immediately reduces owner moderation] -> accepted because speed and simplicity are now the dominant product needs.
- [The codebase contains legacy editorial layers] -> accepted temporarily; future cleanup should remove or archive them explicitly.
- [Browser geolocation remains unreliable in deep background mobile states] -> accepted; tracking is designed for foreground use and manual restart.
- [Place labels on map are heuristic, not geocoded truth] -> accepted to avoid external geocoding cost and complexity.
- [Public image comments increase moderation surface] -> accepted because comments are intentionally lightweight and low-friction.

## Current Architecture Summary

### Frontend surfaces

- Private dashboard: capture, map, timeline, settings, itinerary, invites
- Public trip page: header, gallery, map, timeline, comments
- Public story page: still supported but now secondary

### Storage layers

- `file-store` for local JSON fallback
- `postgres-store` for production durability
- Blob for assets
- Redis for active tracking state

### Important model transitions

- Moments are the primary published entity
- Stories are secondary / legacy
- Comments now attach to `trip`, `story`, or `moment`

## Migration / Cleanup Direction

The next major cleanup phase, if chosen, should:

1. remove the editorial flow from OpenSpec and README as a primary capability
2. remove or archive legacy draft/story APIs if production no longer depends on them
3. simplify the homepage and story page to match the journey-first product
4. keep only the durable reusable primitives:
   - workspace
   - trip
   - contributor
   - leg
   - moment
   - track
   - comment

## Open Questions

- Should legacy story routes remain visible at all, or be formally deprecated?
- Should the homepage be simplified to reflect the new moment-first product more clearly?
- Should image reactions become richer than comments, for example lightweight emoji counts?
