import { getPostgresPool } from "@/lib/postgres";
import * as fileStore from "@/lib/stores/file-store";
import * as postgresStore from "@/lib/stores/postgres-store";
import type { Trip } from "@/lib/types";

const shouldUsePostgresStore = () =>
  Boolean(getPostgresPool()) && process.env.USE_FILE_STORE !== "true";

function getStore() {
  return shouldUsePostgresStore() ? postgresStore : fileStore;
}

export async function getDashboardView(token: string) {
  return getStore().getDashboardView(token);
}

export async function getPublicTripBySlug(slug: string) {
  return getStore().getPublicTripBySlug(slug);
}

export async function getPublishedStoryBySlug(slug: string) {
  return getStore().getPublishedStoryBySlug(slug);
}

export async function listPublishedTrips() {
  return getStore().listPublishedTrips();
}

export async function createTrip(input: Parameters<typeof postgresStore.createTrip>[0], ownerMemberId: string) {
  return getStore().createTrip(input, ownerMemberId);
}

export async function createInvite(tripId: string, memberId: string, label: string) {
  return getStore().createInvite(tripId, memberId, label);
}

export async function updateTripSettings(
  tripId: string,
  patch: Partial<Pick<Trip, "summary" | "visibility" | "mapPrivacy" | "mapDelayMinutes" | "published">>
) {
  return getStore().updateTripSettings(tripId, patch);
}

export async function createLeg(input: Parameters<typeof postgresStore.createLeg>[0]) {
  return getStore().createLeg(input);
}

export async function deleteLeg(legId: string) {
  return getStore().deleteLeg(legId);
}

export async function addMoment(input: Parameters<typeof postgresStore.addMoment>[0]) {
  return getStore().addMoment(input);
}

export async function addPublicComment(input: Parameters<typeof postgresStore.addPublicComment>[0]) {
  return getStore().addPublicComment(input);
}

export async function deletePublicComment(input: Parameters<typeof postgresStore.deletePublicComment>[0]) {
  return getStore().deletePublicComment(input);
}

export async function startTrackSession(tripId: string, memberId: string) {
  return getStore().startTrackSession(tripId, memberId);
}

export async function appendTrackPoint(
  sessionId: string,
  latitude: number,
  longitude: number,
  accuracyMeters: number | null
) {
  return getStore().appendTrackPoint(sessionId, latitude, longitude, accuracyMeters);
}

export async function stopTrackSession(sessionId: string) {
  return getStore().stopTrackSession(sessionId);
}

export async function generateDraft(tripId: string, dayDate: string | null) {
  return getStore().generateDraft(tripId, dayDate);
}

export async function updateDraft(
  draftId: string,
  patch: Partial<Pick<Parameters<typeof postgresStore.updateDraft>[1], "title" | "summary" | "body">>
) {
  return getStore().updateDraft(draftId, patch);
}

export async function deleteDraft(draftId: string) {
  return getStore().deleteDraft(draftId);
}

export async function publishDraft(draftId: string) {
  return getStore().publishDraft(draftId);
}

export async function unpublishStory(storyId: string) {
  return getStore().unpublishStory(storyId);
}

export async function getAsset(assetId: string) {
  return getStore().getAsset(assetId);
}
