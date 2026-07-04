## Context

This repository is currently greenfield and only contains OpenSpec configuration. The desired product is not a one-off holiday microsite but a reusable travel journal platform that can support the July 2026 trip first, then future trips and other contributors with the same core model.

The product must work well from phones, deploy on Vercel, persist media and trip data durably, and produce share-friendly public pages. The user already has a Vercel deployment pattern in the local `eva` example project and wants the future source repository published under the `TomaWaro` GitHub account.

Key constraints:
- Mobile capture must be low-friction for the trip owner and invited contributors.
- Public visibility is quasi-public, not fully open administration.
- Story publication is owner-controlled and manually triggered.
- Media uploads must scale better than Redis can support alone.
- Route display must accept Google Maps links from phones, but the public map should not depend on Google Maps rendering or paid map APIs by default.

## Goals / Non-Goals

**Goals:**
- Model the domain around reusable workspaces, trips, legs, contributors, moments, tracks, drafts, and published stories.
- Support phone-first capture of photos, videos, text, audio, itinerary links, and GPS track sessions.
- Render a trip map with both planned route legs and actual recorded movement.
- Preserve a strong privacy boundary between private raw capture and quasi-public published views.
- Use a storage architecture that is durable, cheap to start, and compatible with Vercel hosting.
- Generate shareable pages with stable URLs and metadata suitable for Discord and WhatsApp previews.

**Non-Goals:**
- Building a native iOS or Android app in the initial release.
- Guaranteeing perfect background GPS tracking while the web app is suspended by the mobile OS.
- Building a generic social network, public comments system, or discovery feed for other travelers.
- Supporting arbitrary non-travel content types outside the travel journal domain.

## Decisions

### 1. Build one product with three surfaces: capture, editorial, and public

The system will be implemented as one web application with three distinct surfaces:
- a contributor capture surface optimized for phones
- an owner editorial surface for review and publishing
- public trip pages for quasi-public consumption

This avoids separate codebases while keeping responsibilities clear.

Alternatives considered:
- Single mixed UI for contributors and viewers: rejected because it would blur permissions and make the mobile flow harder to use.
- Separate admin app and public site: rejected for the first release because it adds deployment and coordination overhead without enough benefit.

### 2. Use Next.js on Vercel instead of a pure Vite SPA

The application will use Next.js on Vercel with server routes and server-rendered public pages. This fits the Vercel deployment target while making it easier to support:
- authenticated server actions and API routes
- Open Graph metadata for shared trip pages
- dynamic public routes per trip and post
- PWA packaging alongside server-driven pages

The `eva` project demonstrates the expected GitHub-to-Vercel workflow, but this product needs richer server-side behavior than a pure Vite SPA is optimized for.

Alternatives considered:
- React + Vite + `/api` functions only: viable, but weaker for server-rendered public pages and metadata.
- Fully static public pages with a separate API backend: rejected because the product has live and editorial features that benefit from a unified server/runtime model.

### 3. Split persistence by concern: Neon Postgres, Vercel Blob, Redis

Durable domain data will live in Neon Postgres connected through Vercel integration. Core entities such as workspaces, trips, contributors, route legs, moments, tracks, drafts, and publications need relational queries, history, filtering, and enforceable integrity. Neon is chosen because it offers a Vercel integration path and a free plan suitable for the initial product.

Vercel Blob will store uploaded media assets and exported track artifacts. Redis on Vercel will only store short-lived or fast-changing data such as active upload sessions, current tracking state, generation jobs, and caches.

Alternatives considered:
- Redis-only architecture: rejected because it is weak for durable relational modeling, migrations, and archive queries across many trips.
- Supabase as the primary backend: viable, but broader than needed for the first release and less aligned with the narrow requirement of durable SQL plus Vercel-native deployment ergonomics.
- Storing media in Postgres: rejected because large binary media does not belong in the transactional database for this use case.

### 4. Use MapLibre with OpenStreetMap-style tiles for public maps

The map surface will render with MapLibre and commodity tile providers instead of Google Maps JavaScript APIs. This keeps public map rendering cheaper, more portable, and independent from Google usage quotas. Google Maps links are treated as import sources for trip intent, not as the rendering engine for the public experience.

Alternatives considered:
- Render public maps with Google Maps: rejected for MVP due to cost, keys, quota management, and tighter coupling.
- Skip map rendering in MVP: rejected because route visibility is a core requirement.

### 5. Import Google Maps URLs as planned routes, but track real movement with browser geolocation

The app will parse shared Google Maps itinerary URLs into planned trip legs when possible. Parsed data will populate origin, destination, waypoints, and travel mode. If parsing is incomplete, the owner can correct the leg manually.

Actual movement will be captured via browser geolocation and recorded as track sessions and track points while the app is open and permitted to access location. The product will not claim guaranteed background tracking when the mobile browser suspends the app.

Alternatives considered:
- Depend on Google APIs for full route computation and live state: rejected for MVP due to cost and setup complexity.
- Only store planned routes without actual tracks: rejected because visible progress is part of the requested experience.
- Attempt always-on background tracking like a native navigation app: rejected because mobile web runtimes do not provide reliable guarantees here.

### 6. Keep publication owner-triggered and privacy-aware

Raw moments, exact media metadata, and precise track points remain private by default. Published trip pages expose only content explicitly promoted to quasi-public visibility. The map privacy model will support either delayed current position or completed segments only; the data model must support both.

Story generation will be owner-triggered for MVP. The agent creates drafts from selected trip content, and the owner reviews and publishes manually.

Alternatives considered:
- Automatic nightly publication: rejected because the user explicitly wants manual validation.
- Fully public live location: rejected because it is not appropriate for a family travel app.

### 7. Model the product as multi-trip and multi-contributor from day one

The data model will include `workspace`, `trip`, and `member` boundaries even if the first live deployment is used by a single family. This prevents hard-coding the July 2026 trip into the system and keeps the product reusable without heavy migrations later.

Alternatives considered:
- Single-trip data model for speed: rejected because it would undermine the explicit reuse requirement.
- Multi-tenant SaaS billing design in MVP: rejected because it adds complexity not needed for the first implementation.

## Risks / Trade-offs

- [Mobile background geolocation is unreliable in browser/PWA contexts] -> Treat foreground tracking as the supported path, expose manual start/stop, and allow manual checkpoint capture when tracking is interrupted.
- [Google Maps shared URLs are not guaranteed to contain all route details in a parseable way] -> Parse best-effort fields and provide manual correction for each leg.
- [Quasi-public map visibility can leak too much location detail] -> Store exact data privately and publish delayed or reduced-precision views only.
- [Multiple storage systems increase implementation complexity] -> Keep boundaries strict: Postgres for durable records, Blob for files, Redis for ephemeral state.
- [Media upload from phones can be slow or flaky on mobile networks] -> Use direct client uploads, resumable/multipart support when available, and draft state that survives interrupted sessions.
- [Manual publishing may create backlog] -> Scope MVP so the owner can generate and publish per day quickly from a compact editorial view.

## Migration Plan

1. Create a dedicated GitHub repository under `TomaWaro` for the travel journal app.
2. Create a Vercel project connected to that repository, following the workflow already used in `eva`.
3. Add integrations for Neon Postgres, Vercel Blob, and Redis on Vercel.
4. Implement the domain schema and seed a first workspace plus the July 2026 trip.
5. Import initial trip legs for Lyon, Lunel, Spain, and Aix-en-Provence.
6. Test mobile capture, GPS sessions, and manual story generation on the owner phone and contributor phone.
7. Publish the first quasi-public trip page.

Rollback strategy:
- Disable public routes while keeping private data intact.
- Stop generation jobs and tracking endpoints independently if needed.
- Preserve durable records in Postgres and media in Blob even if public rendering is rolled back.

## Open Questions

- Should the first public map show delayed live position, or only completed traveled segments?
- Should audio notes be transcribed in MVP, or stored as files only until later enrichment?
- Should contributor onboarding use magic links only, or also support reusable invite links per trip?
