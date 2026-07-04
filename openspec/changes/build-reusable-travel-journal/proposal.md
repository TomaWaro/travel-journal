## Why

The current need is a family travel journal for the July 2026 trip, but the product must be reusable for future trips and by other contributors without redesigning the system each time. A reusable travel app is needed now to support fast mobile capture, itinerary visibility, map-based journey tracking, and manual publication from a Vercel-hosted stack that can be maintained from a phone.

## What Changes

- Create a reusable travel journal web application model centered on workspaces, trips, contributors, daily moments, route legs, GPS tracks, and published stories.
- Support fast mobile capture of photos, videos, text notes, audio notes, and shared Google Maps itinerary links from contributor phones.
- Add a trip map that combines planned route legs imported from Google Maps links with actual recorded track points captured from contributor devices.
- Support manual editorial review and publish flows so generated daily posts remain drafts until explicitly validated.
- Separate private capture data from quasi-public trip pages and shareable story pages suitable for Discord, WhatsApp, and similar channels.
- Define a Vercel-compatible architecture using Blob for media, Redis for live state and short-lived workflows, and a relational database available through Vercel integrations for durable domain data.
- Target deployment from a dedicated GitHub repository under `TomaWaro`, following the existing Vercel deployment style already used in the local `eva` example project.

## Capabilities

### New Capabilities
- `trip-management`: Create and manage reusable trips, legs, contributors, settings, and visibility rules inside a multi-trip workspace.
- `journey-capture`: Capture media, notes, audio, itinerary links, and GPS tracking sessions from mobile devices with minimal friction.
- `journey-map`: Display planned routes and actual traveled paths on a trip map, with privacy-aware public visibility.
- `story-publication`: Generate, review, and manually publish daily or trip-level stories with share-friendly public pages.
- `contributor-access`: Allow multiple invited contributors to add content from their phones while preserving owner control over publication.

### Modified Capabilities

None.

## Impact

- New frontend application optimized for mobile capture and public trip viewing.
- New server-side APIs, background generation hooks, and scheduled or on-demand content compilation flows on Vercel.
- New storage integrations: Vercel Blob for media, Redis on Vercel for live state, and Neon Postgres via Vercel integration for durable relational data.
- New deployment workflow tied to a dedicated GitHub repository under the `TomaWaro` account and a Vercel project derived from that repository.
