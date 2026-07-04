import type { Moment, PublishedStory, TrackPoint, TrackSession, Trip } from "@/lib/types";

export function filterPublicTrackPoints(
  trip: Trip,
  trackPoints: TrackPoint[],
  trackSessions: TrackSession[]
): TrackPoint[] {
  if (trip.mapPrivacy === "completed-only") {
    const completedSessions = new Set(
      trackSessions.filter((session) => session.status === "completed").map((session) => session.id)
    );

    return trackPoints.filter((point) => completedSessions.has(point.trackSessionId));
  }

  const cutoff = Date.now() - trip.mapDelayMinutes * 60_000;

  return trackPoints.filter((point) => new Date(point.recordedAt).getTime() <= cutoff);
}

export function filterPublicMoments(moments: Moment[]): Moment[] {
  return moments.filter((moment) => moment.status === "published");
}

export function sortStories(stories: PublishedStory[]): PublishedStory[] {
  return [...stories].sort((left, right) => {
    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });
}
