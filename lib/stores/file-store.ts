import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getConfiguredOwnerAccessToken,
  isConfiguredOwnerAccessToken,
  isDemoAccessToken,
  isProductionDeployment
} from "@/lib/access";
import { buildTripDays, clampDateToTrip } from "@/lib/date";
import { buildDraftStory } from "@/lib/draft";
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
  TripBundle
} from "@/lib/types";

const dataDirectory = path.join(/* turbopackIgnore: true */ process.cwd(), "data");
const seedPath = path.join(dataDirectory, "seed.travel-journal.json");
const statePath = path.join(dataDirectory, "travel-journal.json");

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "ENOENT" || error.code === "ENOTDIR")
  );
}

function isReadonlyDeploymentError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "EROFS" || error.code === "EPERM" || error.code === "EACCES")
  );
}

function getReadonlyStorageMessage(): string {
  return "Writable local storage is not available on Vercel. Configure Postgres, Redis, and Blob before using write features in production.";
}

async function readState(): Promise<AppState> {
  const normalizeState = (parsed: AppState): AppState => ({
    ...parsed,
    comments: parsed.comments ?? []
  });

  try {
    const json = await readFile(statePath, "utf8");
    return normalizeState(JSON.parse(json) as AppState);
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }

    const json = await readFile(seedPath, "utf8");
    return normalizeState(JSON.parse(json) as AppState);
  }
}

async function writeState(state: AppState): Promise<void> {
  try {
    await mkdir(path.join(dataDirectory, "uploads"), { recursive: true });
    await writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    if (isReadonlyDeploymentError(error)) {
      throw new Error(getReadonlyStorageMessage());
    }

    throw error;
  }
}

function buildTripBundle(state: AppState, trip: Trip): TripBundle {
  const contributorIds = new Set(
    state.contributors.filter((contributor) => contributor.tripId === trip.id).map((contributor) => contributor.memberId)
  );

  return {
    trip,
    days: buildTripDays(trip),
    contributors: state.members.filter((member) => contributorIds.has(member.id)),
    legs: state.legs.filter((leg) => leg.tripId === trip.id).sort((left, right) => left.sequence - right.sequence),
    moments: state.moments
      .filter((moment) => moment.tripId === trip.id)
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
    assets: state.assets.filter((asset) => asset.tripId === trip.id),
    trackSessions: state.trackSessions.filter((session) => session.tripId === trip.id),
    trackPoints: state.trackPoints
      .filter((point) => point.tripId === trip.id)
      .sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime()),
    drafts: state.draftStories
      .filter((draft) => draft.tripId === trip.id)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    stories: state.publishedStories
      .filter((story) => story.tripId === trip.id)
      .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()),
    comments: (state.comments ?? [])
      .filter((comment) => comment.tripId === trip.id)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  };
}

function resolveConfiguredOwnerAccessContext(state: AppState): AccessContext | null {
  if (!getConfiguredOwnerAccessToken()) {
    return null;
  }

  const workspace = state.workspaces[0];

  if (!workspace) {
    return null;
  }

  const member = state.members.find((candidate) => candidate.id === workspace.ownerMemberId);

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

function resolveAccessContext(state: AppState, token: string): AccessContext | null {
  if (isConfiguredOwnerAccessToken(token)) {
    return resolveConfiguredOwnerAccessContext(state);
  }

  if (isProductionDeployment() && isDemoAccessToken(token)) {
    return null;
  }

  const accessLink = state.accessLinks.find((candidate) => candidate.token === token);

  if (!accessLink) {
    return null;
  }

  const workspace = state.workspaces.find((candidate) => candidate.id === accessLink.workspaceId);
  const member = state.members.find((candidate) => candidate.id === accessLink.memberId);

  if (!workspace || !member) {
    return null;
  }

  return { accessLink, member, workspace };
}

export async function getDashboardView(token: string): Promise<DashboardView | null> {
  const state = await readState();
  const access = resolveAccessContext(state, token);

  if (!access) {
    return null;
  }

  const trips = state.trips
    .filter((trip) => {
      if (access.accessLink.role === "owner") {
        return trip.workspaceId === access.workspace.id;
      }

      return trip.id === access.accessLink.tripId;
    })
    .map((trip) => buildTripBundle(state, trip));

  return {
    access,
    role: access.accessLink.role,
    trips
  };
}

export async function getPublicTripBySlug(slug: string): Promise<TripBundle | null> {
  const state = await readState();
  const trip = state.trips.find((candidate) => candidate.slug === slug && candidate.published);

  if (!trip) {
    return null;
  }

  return buildTripBundle(state, trip);
}

export async function getPublishedStoryBySlug(
  slug: string
): Promise<{ story: PublishedStory; trip: Trip; bundle: TripBundle } | null> {
  const state = await readState();
  const story = state.publishedStories.find((candidate) => candidate.slug === slug);

  if (!story) {
    return null;
  }

  const trip = state.trips.find((candidate) => candidate.id === story.tripId);

  if (!trip) {
    return null;
  }

  return {
    story,
    trip,
    bundle: buildTripBundle(state, trip)
  };
}

export async function listPublishedTrips(): Promise<TripBundle[]> {
  const state = await readState();

  return state.trips.filter((trip) => trip.published).map((trip) => buildTripBundle(state, trip));
}

export async function createTrip(input: CreateTripInput, ownerMemberId: string): Promise<Trip> {
  const state = await readState();
  const owner = state.members.find((member) => member.id === ownerMemberId);

  if (!owner) {
    throw new Error("Owner not found");
  }

  const slugBase = input.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const trip: Trip = {
    id: randomUUID(),
    workspaceId: owner.workspaceId,
    ownerMemberId,
    slug: `${slugBase}-${input.startDate}`,
    title: input.title,
    summary: input.summary,
    startDate: input.startDate,
    endDate: input.endDate,
    visibility: input.visibility,
    mapPrivacy: input.mapPrivacy,
    mapDelayMinutes: input.mapDelayMinutes,
    published: input.visibility === "quasi-public",
    liveTrackingUrl: null,
    createdAt: new Date().toISOString()
  };

  state.trips.push(trip);
  state.contributors.push({ tripId: trip.id, memberId: ownerMemberId, role: "owner" });
  await writeState(state);

  return trip;
}

export async function createInvite(tripId: string, memberId: string, label: string) {
  const state = await readState();
  const trip = state.trips.find((candidate) => candidate.id === tripId);

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

  state.accessLinks.push(invite);
  if (!state.contributors.some((contributor) => contributor.tripId === tripId && contributor.memberId === memberId)) {
    state.contributors.push({
      tripId,
      memberId,
      role: "contributor"
    });
  }

  await writeState(state);

  return invite;
}

export async function updateTripSettings(
  tripId: string,
  patch: Partial<Pick<Trip, "summary" | "visibility" | "mapPrivacy" | "mapDelayMinutes" | "published" | "liveTrackingUrl">>
): Promise<Trip> {
  const state = await readState();
  const trip = state.trips.find((candidate) => candidate.id === tripId);

  if (!trip) {
    throw new Error("Trip not found");
  }

  Object.assign(trip, patch);
  await writeState(state);

  return trip;
}

export async function createLeg(input: CreateLegInput): Promise<RouteLeg> {
  const state = await readState();
  const trip = state.trips.find((candidate) => candidate.id === input.tripId);

  if (!trip) {
    throw new Error("Trip not found");
  }

  const leg: RouteLeg = {
    id: randomUUID(),
    tripId: input.tripId,
    sequence:
      Math.max(0, ...state.legs.filter((candidate) => candidate.tripId === input.tripId).map((candidate) => candidate.sequence)) +
      1,
    dayDate: input.dayDate ? clampDateToTrip(trip, input.dayDate) : null,
    title: input.title,
    originLabel: input.originLabel,
    destinationLabel: input.destinationLabel,
    waypoints: input.waypoints,
    travelMode: input.travelMode,
    rawGoogleMapsUrl: input.rawGoogleMapsUrl,
    plannedPath: input.plannedPath
  };

  state.legs.push(leg);
  await writeState(state);

  return leg;
}

export async function deleteLeg(legId: string): Promise<boolean> {
  const state = await readState();
  const initialLength = state.legs.length;
  state.legs = state.legs.filter((leg) => leg.id !== legId);
  if (state.legs.length < initialLength) {
    await writeState(state);
    return true;
  }
  return false;
}

export async function addMoment(input: CreateMomentInput): Promise<Moment> {
  const state = await readState();
  const trip = state.trips.find((candidate) => candidate.id === input.tripId);

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

  state.moments.push(moment);

  if (input.asset) {
    state.assets.push(input.asset);
  }

  await writeState(state);

  return moment;
}

export async function startTrackSession(tripId: string, memberId: string): Promise<TrackSession> {
  const state = await readState();
  const cachedSessionId = await getCachedActiveTrackSessionId(tripId, memberId);

  if (cachedSessionId) {
    const cachedSession = state.trackSessions.find(
      (candidate) => candidate.id === cachedSessionId && candidate.status === "active"
    );

    if (cachedSession) {
      return cachedSession;
    }
  }

  const existingSession = state.trackSessions
    .filter(
      (candidate) =>
        candidate.tripId === tripId &&
        candidate.memberId === memberId &&
        candidate.status === "active"
    )
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0];

  if (existingSession) {
    await setCachedActiveTrackSession(existingSession);
    return existingSession;
  }

  const session: TrackSession = {
    id: randomUUID(),
    tripId,
    memberId,
    status: "active",
    startedAt: new Date().toISOString(),
    endedAt: null
  };

  state.trackSessions.push(session);
  await writeState(state);
  await setCachedActiveTrackSession(session);

  return session;
}

export async function appendTrackPoint(
  sessionId: string,
  latitude: number,
  longitude: number,
  accuracyMeters: number | null
): Promise<TrackPoint> {
  const state = await readState();
  const session = state.trackSessions.find((candidate) => candidate.id === sessionId);

  if (!session) {
    throw new Error("Track session not found");
  }

  const point: TrackPoint = {
    id: randomUUID(),
    trackSessionId: sessionId,
    tripId: session.tripId,
    recordedAt: new Date().toISOString(),
    latitude,
    longitude,
    accuracyMeters
  };

  state.trackPoints.push(point);
  await writeState(state);

  return point;
}

export async function stopTrackSession(sessionId: string): Promise<TrackSession> {
  const state = await readState();
  const session = state.trackSessions.find((candidate) => candidate.id === sessionId);

  if (!session) {
    throw new Error("Track session not found");
  }

  session.status = "completed";
  session.endedAt = new Date().toISOString();
  await writeState(state);
  await clearCachedActiveTrackSession(session.tripId, session.memberId);

  return session;
}

export async function generateDraft(tripId: string, dayDate: string | null): Promise<DraftStory> {
  const state = await readState();
  const trip = state.trips.find((candidate) => candidate.id === tripId);

  if (!trip) {
    throw new Error("Trip not found");
  }

  const matchingMoments = state.moments.filter((moment) => {
    return moment.tripId === tripId && (dayDate ? moment.dayDate === dayDate : true);
  });
  const matchingLegs = state.legs.filter((leg) => {
    return leg.tripId === tripId && (dayDate ? leg.dayDate === dayDate : true);
  });
  const matchingSessions = state.trackSessions.filter((session) => {
    return session.tripId === tripId && (!dayDate || session.startedAt.slice(0, 10) === dayDate);
  });
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

  state.draftStories.push(draft);
  await writeState(state);

  return draft;
}

export async function updateDraft(
  draftId: string,
  patch: Partial<Pick<DraftStory, "title" | "summary" | "body">>
): Promise<DraftStory> {
  const state = await readState();
  const draft = state.draftStories.find((candidate) => candidate.id === draftId);

  if (!draft) {
    throw new Error("Draft not found");
  }

  if (typeof patch.title === "string") {
    draft.title = patch.title.trim();
  }

  if (typeof patch.summary === "string") {
    draft.summary = patch.summary.trim();
  }

  if (typeof patch.body === "string") {
    draft.body = patch.body.trim();
  }

  await writeState(state);

  return draft;
}

export async function deleteDraft(draftId: string): Promise<void> {
  const state = await readState();
  const story = state.publishedStories.find((candidate) => candidate.draftId === draftId);

  if (story) {
    throw new Error("Retire d'abord la publication avant de supprimer ce brouillon.");
  }

  state.draftStories = state.draftStories.filter((candidate) => candidate.id !== draftId);
  await writeState(state);
}

export async function publishDraft(draftId: string): Promise<PublishedStory> {
  const state = await readState();
  const draft = state.draftStories.find((candidate) => candidate.id === draftId);

  if (!draft) {
    throw new Error("Draft not found");
  }

  const existingStory = state.publishedStories.find((candidate) => candidate.draftId === draft.id);
  const nextPublishedAt = new Date().toISOString();
  const story: PublishedStory = existingStory
    ? {
        ...existingStory,
        title: draft.title,
        summary: draft.summary,
        body: draft.body,
        publishedAt: nextPublishedAt
      }
    : {
        id: randomUUID(),
        tripId: draft.tripId,
        draftId: draft.id,
        slug: `${draft.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")}-${draft.id.slice(0, 6)}`,
        title: draft.title,
        summary: draft.summary,
        body: draft.body,
        publishedAt: nextPublishedAt
      };

  if (existingStory) {
    state.publishedStories = state.publishedStories.map((candidate) =>
      candidate.id === existingStory.id ? story : candidate
    );
  } else {
    state.publishedStories.unshift(story);
  }
  state.moments = state.moments.map((moment) => {
    if (draft.sourceMomentIds.includes(moment.id)) {
      return { ...moment, status: "published" };
    }

    return moment;
  });

  await writeState(state);

  return story;
}

export async function unpublishStory(storyId: string): Promise<void> {
  const state = await readState();
  state.publishedStories = state.publishedStories.filter((story) => story.id !== storyId);
  await writeState(state);
}

export async function getAsset(assetId: string): Promise<Asset | null> {
  const state = await readState();

  return state.assets.find((asset) => asset.id === assetId) ?? null;
}

function sanitizeCommentValue(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export async function addPublicComment(input: CreatePublicCommentInput): Promise<PublicComment> {
  const state = await readState();
  const trip = state.trips.find((candidate) => candidate.id === input.tripId && candidate.published);

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (input.storyId) {
    const story = state.publishedStories.find(
      (candidate) => candidate.id === input.storyId && candidate.tripId === input.tripId
    );

    if (!story) {
      throw new Error("Story not found");
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

  state.comments.unshift(comment);
  await writeState(state);

  return comment;
}

export async function deletePublicComment(input: {
  tripId: string;
  momentId: string | null;
  authorName: string;
  body: string;
}): Promise<boolean> {
  const state = await readState();
  const initialLength = state.comments.length;
  state.comments = state.comments.filter(
    (c) =>
      !(
        c.tripId === input.tripId &&
        c.momentId === input.momentId &&
        c.authorName === input.authorName &&
        c.body === input.body
      )
  );
  if (state.comments.length < initialLength) {
    await writeState(state);
    return true;
  }
  return false;
}

export function localAssetPath(asset: Asset): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), asset.path);
}
