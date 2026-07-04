# Travel Journal

Reusable travel journal for phone-first capture, trip maps, and manual story publication.

## Stack

- Next.js App Router on Vercel
- Neon Postgres for durable relational data
- Vercel Blob for media
- Upstash Redis on Vercel for live and short-lived state
- Local file-backed demo store when external services are not configured

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Run `npm install` or `pnpm install`.
3. Run `npm run seed`.
4. Run `npm run dev`.

Demo access links:

- Owner dashboard: `/access/owner-demo-token`
- Contributor dashboard: `/access/son-demo-token`
- Public trip page: `/t/ete-2026-espagne`

## External Setup

The app is coded to be deployable to Vercel, but the following steps are still external operator work:

- Create a GitHub repository under `TomaWaro`
- Connect the repository to a Vercel project
- Add Neon Postgres, Blob, and Redis integrations
- Pull environment variables locally with the Vercel CLI

## Data Modes

- Default mode: local JSON file in `data/travel-journal.json`
- Production mode: enable `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, and Redis credentials

## Operator Workflow

1. Open the owner dashboard at `/access/<owner-token>`.
2. Import or create route legs for the trip.
3. Generate contributor links from the owner panel.
4. Capture moments and GPS tracking from phones during the day.
5. Generate one or more drafts from the editorial panel.
6. Review and publish selected drafts.
7. Share `/t/<trip-slug>` or `/posts/<story-slug>` in WhatsApp or Discord.
8. Reuse the app later by creating a new trip instead of cloning the project.

## Notes

- GPS tracking is designed for foreground mobile web usage.
- Google Maps link import is best effort and falls back to manual correction.
- Story publication is manual even when draft generation is enabled.
