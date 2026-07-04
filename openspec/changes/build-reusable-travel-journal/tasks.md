## 1. Project Setup

- [x] 1.1 Create a dedicated GitHub repository under `TomaWaro` for the travel journal app and connect it to a new Vercel project
- [x] 1.2 Scaffold a Next.js application with App Router, mobile-first layout, and PWA support
- [x] 1.3 Add baseline project tooling for linting, formatting, environment management, and deployment configuration

## 2. Storage and Domain Foundations

- [ ] 2.1 Provision Neon Postgres through a Vercel-compatible integration and add database connection configuration
- [ ] 2.2 Provision Vercel Blob and Redis integrations and wire their environment variables into the project
- [x] 2.3 Define the core schema for workspaces, trips, members, contributors, legs, days, moments, assets, track sessions, track points, drafts, and publications
- [x] 2.4 Implement migrations and seed data for an initial workspace and the July 2026 trip

## 3. Access and Contributor Flows

- [x] 3.1 Implement owner and contributor roles with scoped trip access
- [x] 3.2 Implement invite or magic-link onboarding for contributor phones
- [x] 3.3 Add authorization checks so only owners can change trip settings or publish stories

## 4. Trip Management and Capture

- [x] 4.1 Build trip management screens for creating trips, editing settings, and managing route legs
- [x] 4.2 Implement mobile capture flows for photo, video, text, and audio moments
- [ ] 4.3 Implement direct media upload to Blob and linked moment persistence in Postgres
- [x] 4.4 Implement Google Maps itinerary link import with best-effort parsing and manual correction fallback
- [x] 4.5 Implement GPS track session start, sampling, stop, and persistence flows for active trips

## 5. Map and Timeline Experience

- [x] 5.1 Build the trip timeline view grouped by day with linked moments, legs, and draft status
- [x] 5.2 Build the trip map using MapLibre with separate layers for planned route legs and actual tracks
- [x] 5.3 Implement trip-level map privacy rules for delayed live position and completed-segments-only modes
- [x] 5.4 Surface geolocated moments on the map while keeping non-geolocated moments in the timeline

## 6. Story Generation and Publication

- [x] 6.1 Implement owner-triggered draft generation from moments, route context, and track data
- [x] 6.2 Build an editorial review screen for day recaps and trip-level stories
- [x] 6.3 Implement manual publish and unpublish actions with stable public routes
- [x] 6.4 Add share metadata and preview media handling for public trip and story pages

## 7. Deployment Hardening

- [x] 7.1 Seed the initial Lyon, Lunel, Spain, and Aix-en-Provence legs into the first trip for manual testing
- [ ] 7.2 Verify the core mobile flows on owner and contributor phones, including interrupted uploads and tracking restarts
- [ ] 7.3 Verify public sharing behavior in Discord and WhatsApp with quasi-public visibility enabled
- [x] 7.4 Document the operator workflow for imports, capture, draft generation, publication, and trip reuse
