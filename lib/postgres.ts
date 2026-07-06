import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolClient } from "pg";
import { buildTripDays } from "@/lib/date";
import type { AppState, Trip } from "@/lib/types";

const migrationDirectory = path.join(process.cwd(), "db", "migrations");
const seedPath = path.join(process.cwd(), "data", "seed.travel-journal.json");
const migrationFiles = [
  "0001_initial.sql",
  "0002_public_comments.sql",
  "0003_public_comment_moments.sql",
  "0004_trip_live_tracking_url.sql",
  "0005_trip_live_tracking_path.sql"
] as const;

let pool: Pool | null = null;
let initializationPromise: Promise<void> | null = null;

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

function getTripDays(trip: Trip) {
  return buildTripDays(trip).map((day, index) => ({
    id: `${trip.id}-day-${index + 1}`,
    dayDate: day.date,
    label: day.label
  }));
}

async function insertSeedData(client: PoolClient, state: AppState): Promise<void> {
  for (const workspace of state.workspaces) {
    await client.query(
      `insert into workspaces (id, slug, name, owner_member_id, created_at)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do nothing`,
      [workspace.id, workspace.slug, workspace.name, workspace.ownerMemberId, workspace.createdAt]
    );
  }

  for (const member of state.members) {
    await client.query(
      `insert into members (id, workspace_id, name, handle, created_at)
       values ($1, $2, $3, $4, $5)
       on conflict (id) do nothing`,
      [member.id, member.workspaceId, member.name, member.handle, member.createdAt]
    );
  }

  for (const trip of state.trips) {
    await client.query(
      `insert into trips (
         id,
         workspace_id,
         owner_member_id,
         slug,
         title,
         summary,
         start_date,
         end_date,
         visibility,
         map_privacy,
         map_delay_minutes,
         published,
         created_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       on conflict (id) do nothing`,
      [
        trip.id,
        trip.workspaceId,
        trip.ownerMemberId,
        trip.slug,
        trip.title,
        trip.summary,
        trip.startDate,
        trip.endDate,
        trip.visibility,
        trip.mapPrivacy,
        trip.mapDelayMinutes,
        trip.published,
        trip.createdAt
      ]
    );

    for (const day of getTripDays(trip)) {
      await client.query(
        `insert into trip_days (id, trip_id, day_date, label)
         values ($1, $2, $3, $4)
         on conflict (id) do nothing`,
        [day.id, trip.id, day.dayDate, day.label]
      );
    }
  }

  for (const contributor of state.contributors) {
    await client.query(
      `insert into contributors (trip_id, member_id, role)
       values ($1, $2, $3)
       on conflict (trip_id, member_id) do nothing`,
      [contributor.tripId, contributor.memberId, contributor.role]
    );
  }

  for (const accessLink of state.accessLinks) {
    await client.query(
      `insert into access_links (id, workspace_id, trip_id, member_id, role, label, token, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do nothing`,
      [
        accessLink.id,
        accessLink.workspaceId,
        accessLink.tripId,
        accessLink.memberId,
        accessLink.role,
        accessLink.label,
        accessLink.token,
        accessLink.createdAt
      ]
    );
  }

  for (const leg of state.legs) {
    await client.query(
      `insert into route_legs (
         id,
         trip_id,
         sequence,
         day_date,
         title,
         origin_label,
         destination_label,
         waypoints,
         travel_mode,
         raw_google_maps_url,
         planned_path
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb)
       on conflict (id) do nothing`,
      [
        leg.id,
        leg.tripId,
        leg.sequence,
        leg.dayDate,
        leg.title,
        leg.originLabel,
        leg.destinationLabel,
        JSON.stringify(leg.waypoints),
        leg.travelMode,
        leg.rawGoogleMapsUrl,
        JSON.stringify(leg.plannedPath)
      ]
    );
  }

  for (const asset of state.assets) {
    await client.query(
      `insert into assets (id, trip_id, storage, path, url, mime_type, size_bytes, uploaded_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do nothing`,
      [
        asset.id,
        asset.tripId,
        asset.storage,
        asset.path,
        asset.url,
        asset.mimeType,
        asset.sizeBytes,
        asset.uploadedAt
      ]
    );
  }

  for (const moment of state.moments) {
    await client.query(
      `insert into moments (
         id,
         trip_id,
         member_id,
         day_date,
         type,
         status,
         caption,
         body,
         asset_id,
         latitude,
         longitude,
         created_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       on conflict (id) do nothing`,
      [
        moment.id,
        moment.tripId,
        moment.memberId,
        moment.dayDate,
        moment.type,
        moment.status,
        moment.caption,
        moment.body,
        moment.assetId,
        moment.latitude,
        moment.longitude,
        moment.createdAt
      ]
    );
  }

  for (const session of state.trackSessions) {
    await client.query(
      `insert into track_sessions (id, trip_id, member_id, status, started_at, ended_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do nothing`,
      [
        session.id,
        session.tripId,
        session.memberId,
        session.status,
        session.startedAt,
        session.endedAt
      ]
    );
  }

  for (const point of state.trackPoints) {
    await client.query(
      `insert into track_points (
         id,
         track_session_id,
         trip_id,
         recorded_at,
         latitude,
         longitude,
         accuracy_meters
       )
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do nothing`,
      [
        point.id,
        point.trackSessionId,
        point.tripId,
        point.recordedAt,
        point.latitude,
        point.longitude,
        point.accuracyMeters
      ]
    );
  }

  for (const draft of state.draftStories) {
    await client.query(
      `insert into draft_stories (
         id,
         trip_id,
         day_date,
         title,
         summary,
         body,
         source_moment_ids,
         source_track_session_ids,
         created_at
       )
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)
       on conflict (id) do nothing`,
      [
        draft.id,
        draft.tripId,
        draft.dayDate,
        draft.title,
        draft.summary,
        draft.body,
        JSON.stringify(draft.sourceMomentIds),
        JSON.stringify(draft.sourceTrackSessionIds),
        draft.createdAt
      ]
    );
  }

  for (const story of state.publishedStories) {
    await client.query(
      `insert into published_stories (
         id,
         trip_id,
         draft_id,
         slug,
         title,
         summary,
         body,
         published_at
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do nothing`,
      [
        story.id,
        story.tripId,
        story.draftId,
        story.slug,
        story.title,
        story.summary,
        story.body,
        story.publishedAt
      ]
    );
  }

  for (const comment of state.comments ?? []) {
    await client.query(
      `insert into public_comments (
         id,
         trip_id,
         story_id,
         moment_id,
         author_name,
         body,
         created_at
       )
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do nothing`,
      [
        comment.id,
        comment.tripId,
        comment.storyId,
        comment.momentId ?? null,
        comment.authorName,
        comment.body,
        comment.createdAt
      ]
    );
  }
}

async function runMigrations(client: PoolClient): Promise<void> {
  await client.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  for (const migrationFile of migrationFiles) {
    const alreadyApplied = await client.query(
      "select 1 from schema_migrations where id = $1",
      [migrationFile]
    );

    if (alreadyApplied.rowCount) {
      continue;
    }

    const sql = await readFile(path.join(migrationDirectory, migrationFile), "utf8");
    await client.query(sql);
    await client.query("insert into schema_migrations (id) values ($1)", [migrationFile]);
  }
}

async function seedIfEmpty(client: PoolClient): Promise<void> {
  const workspaceCount = await client.query<{ count: string }>(
    "select count(*)::text as count from workspaces"
  );

  if (Number(workspaceCount.rows[0]?.count ?? "0") > 0) {
    return;
  }

  const seed = JSON.parse(await readFile(seedPath, "utf8")) as AppState;
  await insertSeedData(client, seed);
}

async function initializeDatabase(poolInstance: Pool): Promise<void> {
  const client = await poolInstance.connect();

  try {
    await client.query("begin");
    await runMigrations(client);
    await seedIfEmpty(client);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export function getPostgresPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  return pool;
}

export async function ensurePostgresReady(): Promise<void> {
  const poolInstance = getPostgresPool();

  if (!poolInstance) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!initializationPromise) {
    initializationPromise = initializeDatabase(poolInstance).catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  await initializationPromise;
}

export function toSqlDate(value: string): string {
  return toDateOnly(value);
}
