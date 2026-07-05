## 1. Project Setup

- [x] 1.1 Create a dedicated GitHub repository under `TomaWaro` for the travel journal app and connect it to a Vercel project
- [x] 1.2 Scaffold a Next.js application with App Router, mobile-first layout, and PWA support
- [x] 1.3 Add baseline tooling for linting, TypeScript, environment management, and deployment

## 2. Storage and Domain Foundations

- [x] 2.1 Provision Neon Postgres through a Vercel-compatible integration and add database connection configuration
- [x] 2.2 Provision Vercel Blob and Redis integrations and wire their environment variables into the project
- [x] 2.3 Define the core schema for workspaces, trips, members, contributors, legs, days, moments, assets, track sessions, track points, drafts, publications, and comments
- [x] 2.4 Implement migrations and seed data for an initial reusable workspace/trip model

## 3. Access and Contributor Flows

- [x] 3.1 Implement owner and contributor roles with scoped trip access
- [x] 3.2 Implement token-based contributor onboarding / invite links for phones
- [x] 3.3 Add authorization checks so only owners can change trip settings and sensitive configuration

## 4. Trip Management and Capture

- [x] 4.1 Build trip management screens for creating trips, editing settings, and managing route legs
- [x] 4.2 Implement mobile capture flows for photo, video, text, and audio moments
- [x] 4.3 Implement direct media upload to Blob and linked moment persistence in Postgres
- [x] 4.4 Implement Google Maps itinerary link import with best-effort parsing and manual correction fallback
- [x] 4.5 Implement GPS track session start, sampling, stop, and persistence flows for active trips
- [x] 4.6 Simplify publication so captured moments become public immediately

## 5. Map and Timeline Experience

- [x] 5.1 Build the trip timeline view grouped by day
- [x] 5.2 Build the trip map using MapLibre with separate layers for planned route legs and actual tracks
- [x] 5.3 Implement trip-level map privacy rules for delayed live position and completed-segments-only modes
- [x] 5.4 Surface geolocated moments on the map
- [x] 5.5 Add human-readable location labels for geolocated moments when a place can be inferred

## 6. Public Journey Experience

- [x] 6.1 Build a public trip page suitable for sharing
- [x] 6.2 Replace heavy editorial cards with a simplified public header
- [x] 6.3 Build a horizontal auto-scrolling gallery
- [x] 6.4 Make each gallery item clickable in a fullscreen viewer
- [x] 6.5 Add public comments at the trip level
- [x] 6.6 Add public comments at the moment/image level

## 7. Legacy Editorial Support

- [x] 7.1 Keep draft/story persistence working for backward compatibility
- [x] 7.2 Remove the editorial panel from the main admin workflow
- [x] 7.3 Document that stories/drafts are now secondary compared to immediate moment publication

## 8. Deployment and Handoff

- [x] 8.1 Validate the core mobile/public flows with lint and production builds
- [x] 8.2 Document the operator workflow, storage model, deployment setup, and code structure in `README.md`
- [x] 8.3 Update OpenSpec artifacts so they match the product that actually shipped

## Follow-up Cleanup (Not Yet Done)

- [ ] 9.1 Remove or archive legacy draft/story APIs if they are no longer needed in production
- [ ] 9.2 Simplify the homepage so it reflects the moment-first product instead of older editorial assumptions
- [ ] 9.3 Revisit the public story page and decide whether to keep it, simplify it, or deprecate it
