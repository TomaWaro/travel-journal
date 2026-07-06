export type AccessRole = "owner" | "contributor";
export type TripVisibility = "private" | "quasi-public";
export type MapPrivacy = "delayed" | "completed-only";
export type TravelMode = "driving" | "walking" | "transit" | "cycling";
export type MomentType = "photo" | "video" | "audio" | "text";
export type MomentStatus = "draft" | "published" | "private";
export type StorageKind = "local" | "blob";
export type TrackSessionStatus = "active" | "completed";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  ownerMemberId: string;
  createdAt: string;
}

export interface Member {
  id: string;
  workspaceId: string;
  name: string;
  handle: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  workspaceId: string;
  ownerMemberId: string;
  slug: string;
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  visibility: TripVisibility;
  mapPrivacy: MapPrivacy;
  mapDelayMinutes: number;
  published: boolean;
  liveTrackingUrl: string | null;
  createdAt: string;
}

export interface Contributor {
  tripId: string;
  memberId: string;
  role: AccessRole;
}

export interface AccessLink {
  id: string;
  workspaceId: string;
  tripId: string | null;
  memberId: string;
  role: AccessRole;
  label: string;
  token: string;
  createdAt: string;
}

export interface RouteLeg {
  id: string;
  tripId: string;
  sequence: number;
  dayDate: string | null;
  title: string;
  originLabel: string;
  destinationLabel: string;
  waypoints: string[];
  travelMode: TravelMode;
  rawGoogleMapsUrl: string | null;
  plannedPath: LatLng[];
}

export interface Asset {
  id: string;
  tripId: string;
  storage: StorageKind;
  path: string;
  url: string;
  mimeType: string;
  sizeBytes: number | null;
  uploadedAt: string;
}

export interface Moment {
  id: string;
  tripId: string;
  memberId: string;
  dayDate: string;
  type: MomentType;
  status: MomentStatus;
  caption: string;
  body: string;
  assetId: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface TrackSession {
  id: string;
  tripId: string;
  memberId: string;
  status: TrackSessionStatus;
  startedAt: string;
  endedAt: string | null;
}

export interface TrackPoint {
  id: string;
  trackSessionId: string;
  tripId: string;
  recordedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
}

export interface DraftStory {
  id: string;
  tripId: string;
  dayDate: string | null;
  title: string;
  summary: string;
  body: string;
  sourceMomentIds: string[];
  sourceTrackSessionIds: string[];
  createdAt: string;
}

export interface PublishedStory {
  id: string;
  tripId: string;
  draftId: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  publishedAt: string;
}

export interface PublicComment {
  id: string;
  tripId: string;
  storyId: string | null;
  momentId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface AppState {
  version: number;
  workspaces: Workspace[];
  members: Member[];
  trips: Trip[];
  contributors: Contributor[];
  accessLinks: AccessLink[];
  legs: RouteLeg[];
  assets: Asset[];
  moments: Moment[];
  trackSessions: TrackSession[];
  trackPoints: TrackPoint[];
  draftStories: DraftStory[];
  publishedStories: PublishedStory[];
  comments: PublicComment[];
}

export interface TripDay {
  date: string;
  label: string;
}

export interface AccessContext {
  accessLink: AccessLink;
  member: Member;
  workspace: Workspace;
}

export interface TripBundle {
  trip: Trip;
  days: TripDay[];
  contributors: Member[];
  legs: RouteLeg[];
  moments: Moment[];
  assets: Asset[];
  trackSessions: TrackSession[];
  trackPoints: TrackPoint[];
  drafts: DraftStory[];
  stories: PublishedStory[];
  comments: PublicComment[];
}

export interface DashboardView {
  access: AccessContext;
  role: AccessRole;
  trips: TripBundle[];
}

export interface CreateTripInput {
  title: string;
  summary: string;
  startDate: string;
  endDate: string;
  visibility: TripVisibility;
  mapPrivacy: MapPrivacy;
  mapDelayMinutes: number;
}

export interface CreateLegInput {
  tripId: string;
  dayDate: string | null;
  title: string;
  originLabel: string;
  destinationLabel: string;
  waypoints: string[];
  travelMode: TravelMode;
  rawGoogleMapsUrl: string | null;
  plannedPath: LatLng[];
}

export interface CreateMomentInput {
  tripId: string;
  memberId: string;
  type: MomentType;
  caption: string;
  body: string;
  dayDate: string;
  latitude: number | null;
  longitude: number | null;
  asset: Asset | null;
}

export interface CreatePublicCommentInput {
  tripId: string;
  storyId: string | null;
  momentId?: string | null;
  authorName: string;
  body: string;
}
