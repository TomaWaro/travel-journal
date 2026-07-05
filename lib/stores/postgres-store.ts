import { randomUUID } from "node:crypto";
import {
  getConfiguredOwnerAccessToken,
  isConfiguredOwnerAccessToken,
  isDemoAccessToken,
  isProductionDeployment
} from "@/lib/access";
import { buildTripDays, clampDateToTrip } from "@/lib/date";
import { buildDraftStory } from "@/lib/draft";
import { ensurePostgresReady, getPostgresPool, toSqlDate } from "@/lib/postgres";
import {
  clearCachedActiveTrackSession,
  getCachedActiveTrackSessionId,
  setCachedActiveTrackSession
} from "@/lib/tracking-cache";
import type {
  AccessContext,
  AppState,
  Asset,
  CreateLegInput,
  CreateMomentInput,
  CreatePublicCommentInput,
  CreateTripInput,
  DashboardView,
  DraftStory,
  Member,
  Moment,
  PublicComment,
  PublishedStory,
  RouteLeg,
  TrackPoint,
  TrackSession,
  Trip,
  TripBundle,
  Workspace
} from "@/lib/types";
import type { Pool, PoolClient } from "pg";

type Queryable = Pool | PoolClient;
type SqlRow = Record<string, unknown>;

function getPool(): Pool {
  const pool = getPostgresPool();

  if (!pool) {
    throw new Error("DATABASE_URL is not configured");
  }

  return pool;
}

function toIsoTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(String(value)).toISOString();
}

function toDateOnly(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapWorkspace(row: SqlRow): Workspace {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    ownerMemberId: String(row.owner_member_id),
    createdAt: toIsoTimestamp(row.created_at)
  };
}

function mapMember(row: SqlRow): Member {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    name: String(row.name),
    handle: String(row.handle),
    createdAt: toIsoTimestamp(row.created_at)
  };
}

function mapTrip(row: SqlRow): Trip {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    ownerMemberId: String(row.owner_member_id),
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    startDate: toDateOnly(row.start_date),
    endDate: toDateOnly(row.end_date),
    visibility: row.visibility as Trip["visibility"],
    mapPrivacy: row.map_privacy as Trip["mapPrivacy"],
    mapDelayMinutes: Number(row.map_delay_minutes),
    published: Boolean(row.published),
    createdAt: toIsoTimestamp(row.created_at)
  };
}

function mapLeg(row: SqlRow): RouteLeg {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    sequence: Number(row.sequence),
    dayDate: row.day_date ? toDateOnly(row.day_date) : null,
    title: String(row.title),
    originLabel: String(row.origin_label),
    destinationLabel: String(row.destination_label),
    waypoints: parseJsonValue<string[]>(row.waypoints, []),
    travelMode: row.travel_mode as RouteLeg["travelMode"],
    rawGoogleMapsUrl: row.raw_google_maps_url ? String(row.raw_google_maps_url) : null,
    plannedPath: parseJsonValue<RouteLeg["plannedPath"]>(row.planned_path, [])
  };
}

function mapAsset(row: SqlRow): Asset {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    storage: row.storage as Asset["storage"],
    path: String(row.path),
    url: String(row.url),
    mimeType: String(row.mime_type),
    sizeBytes: row.size_bytes === null || row.size_bytes === undefined ? null : Number(row.size_bytes),
    uploadedAt: toIsoTimestamp(row.uploaded_at)
  };
}

function mapMoment(row: SqlRow): Moment {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    memberId: String(row.member_id),
    dayDate: toDateOnly(row.day_date),
    type: row.type as Moment["type"],
    status: row.status as Moment["status"],
    caption: row.caption ? String(row.caption) : "",
    body: row.body ? String(row.body) : "",
    assetId: row.asset_id ? String(row.asset_id) : null,
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    createdAt: toIsoTimestamp(row.created_at)
  };
}

function mapTrackSession(row: SqlRow): TrackSession {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    memberId: String(row.member_id),
    status: row.status as TrackSession["status"],
    startedAt: toIsoTimestamp(row.started_at),
    endedAt: row.ended_at ? toIsoTimestamp(row.ended_at) : null
  };
}

function mapTrackPoint(row: SqlRow): TrackPoint {
  return {
    id: String(row.id),
    trackSessionId: String(row.track_session_id),
    tripId: String(row.trip_id),
    recordedAt: toIsoTimestamp(row.recorded_at),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    accuracyMeters:
      row.accuracy_meters === null || row.accuracy_meters === undefined
        ? null
        : Number(row.accuracy_meters)
  };
}

function mapDraftStory(row: SqlRow): DraftStory {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    dayDate: row.day_date ? toDateOnly(row.day_date) : null,
    title: String(row.title),
    summary: String(row.summary),
    body: String(row.body),
    sourceMomentIds: parseJsonValue<string[]>(row.source_moment_ids, []),
    sourceTrackSessionIds: parseJsonValue<string[]>(row.source_track_session_ids, []),
    createdAt: toIsoTimestamp(row.created_at)
  };
}

function mapPublishedStory(row: SqlRow): PublishedStory {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    draftId: String(row.draft_id),
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    body: String(row.body),
    publishedAt: toIsoTimestamp(row.published_at)
  };
}

function mapPublicComment(row: SqlRow): PublicComment {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    storyId: row.story_id ? String(row.story_id) : null,
    momentId: row.moment_id ? String(row.moment_id) : null,
    authorName: String(row.author_name),
    body: String(row.body),
    createdAt: toIsoTimestamp(row.created_at)
  };
}

async function queryRows(db: Queryable, text: string, values: unknown[] = []): Promise<SqlRow[]> {
  const result = await db.query(text, values);
  return result.rows as SqlRow[];
}

async function queryOne(db: Queryable, text: string, values: unknown[] = []): Promise<SqlRow | null> {
  const rows = await queryRows(db, text, values);
  return rows[0] ?? null;
}

async function withReadyPool<T>(work: (db: Pool) => Promise<T>): Promise<T> {
  await ensurePostgresReady();
  return work(getPool());
}

async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  await ensurePostgresReady();
  const client = await getPool().connect();

  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function getWorkspaceById(db: Queryable, workspaceId: string): Promise<Workspace | null> {
  const row = await queryOne(db, "select * from workspaces where id = $1", [workspaceId]);
  return row ? mapWorkspace(row) : null;
}

async function getMemberById(db: Queryable, memberId: string): Promise<Member | null> {
  const row = await queryOne(db, "select * from members where id = $1", [memberId]);
  return row ? mapMember(row) : null;
}

async function getTripById(db: Queryable, tripId: string): Promise<Trip | null> {
  const row = await queryOne(db, "select * from trips where id = $1", [tripId]);
  return row ? mapTrip(row) : null;
}

async function insertTripDays(db: Queryable, trip: Trip): Promise<void> {
  for (const [index, day] of buildTripDays(trip).entries()) {
    await db.query(
      `insert into trip_days (id, trip_id, day_date, label)
       values ($1, $2, $3, $4)
       on conflict (id) do update set day_date = excluded.day_date, label = excluded.label`,
      [`${trip.id}-day-${index + 1}`, trip.id, day.date, day.label]
    );
  }
}

async function loadTripBundle(db: Queryable, trip: Trip): Promise<TripBundle> {
  const contributorRows = await queryRows(
    db,
    `select members.*
     from contributors
     join members on members.id = contributors.member_id
     where contributors.trip_id = $1
     order by members.created_at asc`,
    [trip.id]
  );
  const legRows = await queryRows(
    db,
    "select * from route_legs where trip_id = $1 order by sequence asc",
    [trip.id]
  );
  const momentRows = await queryRows(
    db,
    "select * from moments where trip_id = $1 order by created_at asc",
    [trip.id]
  );
  const assetRows = await queryRows(db, "select * from assets where trip_id = $1", [trip.id]);
  const trackSessionRows = await queryRows(
    db,
    "select * from track_sessions where trip_id = $1",
    [trip.id]
  );
  const trackPointRows = await queryRows(
    db,
    "select * from track_points where trip_id = $1 order by recorded_at asc",
    [trip.id]
  );
  const draftRows = await queryRows(
    db,
    "select * from draft_stories where trip_id = $1 order by created_at desc",
    [trip.id]
  );
  const storyRows = await queryRows(
    db,
    "select * from published_stories where trip_id = $1 order by published_at desc",
    [trip.id]
  );
  const commentRows = await queryRows(
    db,
    "select * from public_comments where trip_id = $1 order by created_at desc",
    [trip.id]
  );

  return {
    trip,
    days: buildTripDays(trip),
    contributors: contributorRows.map(mapMember),
    legs: legRows.map(mapLeg),
    moments: momentRows.map(mapMoment),
    assets: assetRows.map(mapAsset),
    trackSessions: trackSessionRows.map(mapTrackSession),
    trackPoints: trackPointRows.map(mapTrackPoint),
    drafts: draftRows.map(mapDraftStory),
    stories: storyRows.map(mapPublishedStory),
    comments: commentRows.map(mapPublicComment)
  };
}

async function resolveAccessContext(db: Queryable, token: string): Promise<AccessContext | null> {
  if (isConfiguredOwnerAccessToken(token)) {
    const workspaceRow = await queryOne(
      db,
      "select * from workspaces order by created_at asc limit 1"
    );

    if (!workspaceRow) {
      return null;
    }

    const workspace = mapWorkspace(workspaceRow);
    const member = await getMemberById(db, workspace.ownerMemberId);

    if (!member) {
      return null;
    }

    return {
      accessLink: {
        id: "configured-owner-access",
        workspaceId: workspace.id,
        tripId: null,
        memberId: member.id,
        role: "owner",
        label: "Configured owner access",
        token: getConfiguredOwnerAccessToken() ?? "",
        createdAt: workspace.createdAt
      },
      member,
      workspace
    };
  }

  if (isProductionDeployment() && isDemoAccessToken(token)) {
    return null;
  }

  const accessLinkRow = await queryOne(db, "select * from access_links where token = $1", [token]);

  if (!accessLinkRow) {
    return null;
  }

  const workspace = await getWorkspaceById(db, String(accessLinkRow.workspace_id));
  const member = await getMemberById(db, String(accessLinkRow.member_id));

  if (!workspace || !member) {
    return null;
  }

  return {
    accessLink: {
      id: String(accessLinkRow.id),
      workspaceId: String(accessLinkRow.workspace_id),
      tripId: accessLinkRow.trip_id ? String(accessLinkRow.trip_id) : null,
      memberId: String(accessLinkRow.member_id),
      role: accessLinkRow.role as AccessContext["accessLink"]["role"],
      label: String(accessLinkRow.label),
      token: String(accessLinkRow.token),
      createdAt: toIsoTimestamp(accessLinkRow.created_at)
    },
    member,
    workspace
  };
}

async function findActiveTrackSession(
  db: Queryable,
  tripId: string,
  memberId: string
): Promise<TrackSession | null> {
  const cachedSessionId = await getCachedActiveTrackSessionId(tripId, memberId);

  if (cachedSessionId) {
    const cachedRow = await queryOne(
      db,
      "select * from track_sessions where id = $1 and status = 'active'",
      [cachedSessionId]
    );

    if (cachedRow) {
      return mapTrackSession(cachedRow);
    }
  }

  const row = await queryOne(
    db,
    `select *
     from track_sessions
     where trip_id = $1 and member_id = $2 and status = 'active'
     order by started_at desc
     limit 1`,
    [tripId, memberId]
  );

  if (!row) {
    return null;
  }

  const session = mapTrackSession(row);
  await setCachedActiveTrackSession(session);
  return session;
}

export async function getDashboardView(token: string): Promise<DashboardView | null> {
  return withReadyPool(async (db) => {
    const access = await resolveAccessContext(db, token);

    if (!access) {
      return null;
    }

    const tripRows =
      access.accessLink.role === "owner"
        ? await queryRows(
            db,
            "select * from trips where workspace_id = $1 order by start_date asc",
            [access.workspace.id]
          )
        : await queryRows(
            db,
            "select * from trips where id = $1 order by start_date asc",
            [access.accessLink.tripId]
          );

    const trips = await Promise.all(tripRows.map((row) => loadTripBundle(db, mapTrip(row))));

    return {
      access,
      role: access.accessLink.role,
      trips
    };
  });
}

export async function getPublicTripBySlug(slug: string): Promise<TripBundle | null> {
  return withReadyPool(async (db) => {
    const tripRow = await queryOne(
      db,
      "select * from trips where slug = $1 and published = true",
      [slug]
    );

    if (!tripRow) {
      return null;
    }

    return loadTripBundle(db, mapTrip(tripRow));
  });
}

export async function getPublishedStoryBySlug(
  slug: string
): Promise<{ story: PublishedStory; trip: Trip; bundle: TripBundle } | null> {
  return withReadyPool(async (db) => {
    const storyRow = await queryOne(
      db,
      "select * from published_stories where slug = $1",
      [slug]
    );

    if (!storyRow) {
      return null;
    }

    const story = mapPublishedStory(storyRow);
    const trip = await getTripById(db, story.tripId);

    if (!trip) {
      return null;
    }

    return {
      story,
      trip,
      bundle: await loadTripBundle(db, trip)
    };
  });
}

export async function listPublishedTrips(): Promise<TripBundle[]> {
  return withReadyPool(async (db) => {
    const tripRows = await queryRows(
      db,
      "select * from trips where published = true order by start_date asc"
    );

    return Promise.all(tripRows.map((row) => loadTripBundle(db, mapTrip(row))));
  });
}

export async function createTrip(input: CreateTripInput, ownerMemberId: string): Promise<Trip> {
  return withTransaction(async (client) => {
    const owner = await getMemberById(client, ownerMemberId);

    if (!owner) {
      throw new Error("Owner not found");
    }

    const trip: Trip = {
      id: randomUUID(),
      workspaceId: owner.workspaceId,
      ownerMemberId,
      slug: `${slugify(input.title)}-${input.startDate}`,
      title: input.title,
      summary: input.summary,
      startDate: input.startDate,
      endDate: input.endDate,
      visibility: input.visibility,
      mapPrivacy: input.mapPrivacy,
      mapDelayMinutes: input.mapDelayMinutes,
      published: input.visibility === "quasi-public",
      createdAt: new Date().toISOString()
    };

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
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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
    await client.query(
      "insert into contributors (trip_id, member_id, role) values ($1, $2, $3)",
      [trip.id, ownerMemberId, "owner"]
    );
    await insertTripDays(client, trip);

    return trip;
  });
}

export async function createInvite(tripId: string, memberId: string, label: string) {
  return withTransaction(async (client) => {
    const trip = await getTripById(client, tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    const invite = {
      id: randomUUID(),
      workspaceId: trip.workspaceId,
      tripId,
      memberId,
      role: "contributor" as const,
      label,
      token: randomUUID(),
      createdAt: new Date().toISOString()
    };

    await client.query(
      `insert into access_links (id, workspace_id, trip_id, member_id, role, label, token, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        invite.id,
        invite.workspaceId,
        invite.tripId,
        invite.memberId,
        invite.role,
        invite.label,
        invite.token,
        invite.createdAt
      ]
    );
    await client.query(
      `insert into contributors (trip_id, member_id, role)
       values ($1, $2, $3)
       on conflict (trip_id, member_id) do update set role = excluded.role`,
      [tripId, memberId, "contributor"]
    );

    return invite;
  });
}

export async function updateTripSettings(
  tripId: string,
  patch: Partial<Pick<Trip, "summary" | "visibility" | "mapPrivacy" | "mapDelayMinutes" | "published">>
): Promise<Trip> {
  return withTransaction(async (client) => {
    const trip = await getTripById(client, tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    const nextTrip: Trip = {
      ...trip,
      ...patch
    };

    await client.query(
      `update trips
       set summary = $2,
           visibility = $3,
           map_privacy = $4,
           map_delay_minutes = $5,
           published = $6
       where id = $1`,
      [
        tripId,
        nextTrip.summary,
        nextTrip.visibility,
        nextTrip.mapPrivacy,
        nextTrip.mapDelayMinutes,
        nextTrip.published
      ]
    );

    return nextTrip;
  });
}

export async function createLeg(input: CreateLegInput): Promise<RouteLeg> {
  return withTransaction(async (client) => {
    const trip = await getTripById(client, input.tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    const sequenceRow = await queryOne(
      client,
      "select coalesce(max(sequence), 0) as max_sequence from route_legs where trip_id = $1",
      [input.tripId]
    );
    const leg: RouteLeg = {
      id: randomUUID(),
      tripId: input.tripId,
      sequence: Number(sequenceRow?.max_sequence ?? 0) + 1,
      dayDate: input.dayDate ? clampDateToTrip(trip, input.dayDate) : null,
      title: input.title,
      originLabel: input.originLabel,
      destinationLabel: input.destinationLabel,
      waypoints: input.waypoints,
      travelMode: input.travelMode,
      rawGoogleMapsUrl: input.rawGoogleMapsUrl,
      plannedPath: input.plannedPath
    };

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
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb)`,
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

    return leg;
  });
}

export async function deleteLeg(legId: string): Promise<boolean> {
  return withTransaction(async (client) => {
    const result = await client.query(
      "delete from route_legs where id = $1",
      [legId]
    );
    return (result.rowCount ?? 0) > 0;
  });
}

export async function addMoment(input: CreateMomentInput): Promise<Moment> {
  return withTransaction(async (client) => {
    const trip = await getTripById(client, input.tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    const moment: Moment = {
      id: randomUUID(),
      tripId: input.tripId,
      memberId: input.memberId,
      dayDate: clampDateToTrip(trip, input.dayDate),
      type: input.type,
      status: "published",
      caption: input.caption,
      body: input.body,
      assetId: input.asset?.id ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      createdAt: new Date().toISOString()
    };

    if (input.asset) {
      await client.query(
        `insert into assets (id, trip_id, storage, path, url, mime_type, size_bytes, uploaded_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (id) do update
         set storage = excluded.storage,
             path = excluded.path,
             url = excluded.url,
             mime_type = excluded.mime_type,
             size_bytes = excluded.size_bytes,
             uploaded_at = excluded.uploaded_at`,
        [
          input.asset.id,
          input.asset.tripId,
          input.asset.storage,
          input.asset.path,
          input.asset.url,
          input.asset.mimeType,
          input.asset.sizeBytes,
          input.asset.uploadedAt
        ]
      );
    }

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
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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

    return moment;
  });
}

export async function startTrackSession(tripId: string, memberId: string): Promise<TrackSession> {
  return withTransaction(async (client) => {
    const existing = await findActiveTrackSession(client, tripId, memberId);

    if (existing) {
      return existing;
    }

    const session: TrackSession = {
      id: randomUUID(),
      tripId,
      memberId,
      status: "active",
      startedAt: new Date().toISOString(),
      endedAt: null
    };

    await client.query(
      `insert into track_sessions (id, trip_id, member_id, status, started_at, ended_at)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        session.id,
        session.tripId,
        session.memberId,
        session.status,
        session.startedAt,
        session.endedAt
      ]
    );
    await setCachedActiveTrackSession(session);

    return session;
  });
}

export async function appendTrackPoint(
  sessionId: string,
  latitude: number,
  longitude: number,
  accuracyMeters: number | null
): Promise<TrackPoint> {
  return withTransaction(async (client) => {
    const sessionRow = await queryOne(
      client,
      "select * from track_sessions where id = $1",
      [sessionId]
    );

    if (!sessionRow) {
      throw new Error("Track session not found");
    }

    const session = mapTrackSession(sessionRow);
    const point: TrackPoint = {
      id: randomUUID(),
      trackSessionId: sessionId,
      tripId: session.tripId,
      recordedAt: new Date().toISOString(),
      latitude,
      longitude,
      accuracyMeters
    };

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
       values ($1, $2, $3, $4, $5, $6, $7)`,
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

    return point;
  });
}

export async function stopTrackSession(sessionId: string): Promise<TrackSession> {
  return withTransaction(async (client) => {
    const sessionRow = await queryOne(
      client,
      "select * from track_sessions where id = $1",
      [sessionId]
    );

    if (!sessionRow) {
      throw new Error("Track session not found");
    }

    const session = mapTrackSession(sessionRow);
    const stoppedSession: TrackSession = {
      ...session,
      status: "completed",
      endedAt: new Date().toISOString()
    };

    await client.query(
      "update track_sessions set status = $2, ended_at = $3 where id = $1",
      [sessionId, stoppedSession.status, stoppedSession.endedAt]
    );
    await clearCachedActiveTrackSession(session.tripId, session.memberId);

    return stoppedSession;
  });
}

export async function generateDraft(tripId: string, dayDate: string | null): Promise<DraftStory> {
  return withTransaction(async (client) => {
    const trip = await getTripById(client, tripId);

    if (!trip) {
      throw new Error("Trip not found");
    }

    const matchingMoments = (
      await queryRows(
        client,
        `select * from moments
         where trip_id = $1
           and ($2::date is null or day_date = $2::date)
         order by created_at asc`,
        [tripId, dayDate]
      )
    ).map(mapMoment);
    const matchingLegs = (
      await queryRows(
        client,
        `select * from route_legs
         where trip_id = $1
           and ($2::date is null or day_date = $2::date)
         order by sequence asc`,
        [tripId, dayDate]
      )
    ).map(mapLeg);
    const matchingSessions = (
      await queryRows(
        client,
        `select * from track_sessions
         where trip_id = $1
           and ($2::date is null or started_at::date = $2::date)
         order by started_at asc`,
        [tripId, dayDate]
      )
    ).map(mapTrackSession);

    const draftInput = buildDraftStory({
      trip,
      dayDate,
      moments: matchingMoments,
      legs: matchingLegs,
      sessions: matchingSessions
    });
    const draft: DraftStory = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...draftInput
    };

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
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)`,
      [
        draft.id,
        draft.tripId,
        draft.dayDate ? toSqlDate(draft.dayDate) : null,
        draft.title,
        draft.summary,
        draft.body,
        JSON.stringify(draft.sourceMomentIds),
        JSON.stringify(draft.sourceTrackSessionIds),
        draft.createdAt
      ]
    );

    return draft;
  });
}

export async function updateDraft(
  draftId: string,
  patch: Partial<Pick<DraftStory, "title" | "summary" | "body">>
): Promise<DraftStory> {
  return withTransaction(async (client) => {
    const draftRow = await queryOne(client, "select * from draft_stories where id = $1", [draftId]);

    if (!draftRow) {
      throw new Error("Draft not found");
    }

    const draft = mapDraftStory(draftRow);
    const nextDraft: DraftStory = {
      ...draft,
      title: typeof patch.title === "string" ? patch.title.trim() : draft.title,
      summary: typeof patch.summary === "string" ? patch.summary.trim() : draft.summary,
      body: typeof patch.body === "string" ? patch.body.trim() : draft.body
    };

    await client.query(
      `update draft_stories
       set title = $2,
           summary = $3,
           body = $4
       where id = $1`,
      [draftId, nextDraft.title, nextDraft.summary, nextDraft.body]
    );

    return nextDraft;
  });
}

export async function deleteDraft(draftId: string): Promise<void> {
  return withTransaction(async (client) => {
    const storyRow = await queryOne(client, "select id from published_stories where draft_id = $1", [draftId]);

    if (storyRow) {
      throw new Error("Retire d'abord la publication avant de supprimer ce brouillon.");
    }

    await client.query("delete from draft_stories where id = $1", [draftId]);
  });
}

export async function publishDraft(draftId: string): Promise<PublishedStory> {
  return withTransaction(async (client) => {
    const draftRow = await queryOne(
      client,
      "select * from draft_stories where id = $1",
      [draftId]
    );

    if (!draftRow) {
      throw new Error("Draft not found");
    }

    const draft = mapDraftStory(draftRow);
    const existingStoryRow = await queryOne(client, "select * from published_stories where draft_id = $1", [draftId]);
    const nextPublishedAt = new Date().toISOString();
    const story: PublishedStory = existingStoryRow
      ? {
          ...mapPublishedStory(existingStoryRow),
          title: draft.title,
          summary: draft.summary,
          body: draft.body,
          publishedAt: nextPublishedAt
        }
      : {
          id: randomUUID(),
          tripId: draft.tripId,
          draftId: draft.id,
          slug: `${slugify(draft.title)}-${draft.id.slice(0, 6)}`,
          title: draft.title,
          summary: draft.summary,
          body: draft.body,
          publishedAt: nextPublishedAt
        };

    if (existingStoryRow) {
      await client.query(
        `update published_stories
         set title = $2,
             summary = $3,
             body = $4,
             published_at = $5
         where id = $1`,
        [story.id, story.title, story.summary, story.body, story.publishedAt]
      );
    } else {
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
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
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

    if (draft.sourceMomentIds.length > 0) {
      await client.query(
        `update moments
         set status = 'published'
         where id = any($1::text[])`,
        [draft.sourceMomentIds]
      );
    }

    return story;
  });
}

export async function unpublishStory(storyId: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("delete from published_stories where id = $1", [storyId]);
  });
}

export async function getAsset(assetId: string): Promise<Asset | null> {
  return withReadyPool(async (db) => {
    const row = await queryOne(db, "select * from assets where id = $1", [assetId]);
    return row ? mapAsset(row) : null;
  });
}

function sanitizeCommentValue(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export async function addPublicComment(input: CreatePublicCommentInput): Promise<PublicComment> {
  return withTransaction(async (client) => {
    const trip = await getTripById(client, input.tripId);

    if (!trip || !trip.published) {
      throw new Error("Trip not found");
    }

    if (input.storyId) {
      const storyRow = await queryOne(
        client,
        "select * from published_stories where id = $1 and trip_id = $2",
        [input.storyId, input.tripId]
      );

      if (!storyRow) {
        throw new Error("Story not found");
      }
    }

    if (input.momentId) {
      const momentRow = await queryOne(
        client,
        "select * from moments where id = $1 and trip_id = $2 and status = 'published'",
        [input.momentId, input.tripId]
      );

      if (!momentRow) {
        throw new Error("Moment not found");
      }
    }

    const authorName = sanitizeCommentValue(input.authorName, 50);
    const body = input.body.trim().slice(0, 1200);

    if (!authorName) {
      throw new Error("Le nom est requis.");
    }

    if (!body) {
      throw new Error("Le commentaire est requis.");
    }

    const comment: PublicComment = {
      id: randomUUID(),
      tripId: input.tripId,
      storyId: input.storyId,
      momentId: input.momentId ?? null,
      authorName,
      body,
      createdAt: new Date().toISOString()
    };

    await client.query(
      `insert into public_comments (id, trip_id, story_id, moment_id, author_name, body, created_at)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        comment.id,
        comment.tripId,
        comment.storyId,
        comment.momentId,
        comment.authorName,
        comment.body,
        comment.createdAt
      ]
    );

    return comment;
  });
}

export async function deletePublicComment(input: {
  tripId: string;
  momentId: string | null;
  authorName: string;
  body: string;
}): Promise<boolean> {
  return withTransaction(async (client) => {
    const result = await client.query(
      `delete from public_comments 
       where trip_id = $1 
         and (moment_id = $2 or (moment_id is null and $2 is null)) 
         and author_name = $3 
         and body = $4`,
      [
        input.tripId,
        input.momentId,
        input.authorName,
        input.body
      ]
    );
    return (result.rowCount ?? 0) > 0;
  });
}
