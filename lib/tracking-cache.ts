import type { TrackSession } from "@/lib/types";
import { getRedisClient } from "@/lib/redis";

const activeTrackTtlSeconds = 60 * 60 * 24 * 7;

function activeTrackKey(tripId: string, memberId: string) {
  return `travel-journal:active-track:${tripId}:${memberId}`;
}

export async function getCachedActiveTrackSessionId(
  tripId: string,
  memberId: string
): Promise<string | null> {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  try {
    return (await redis.get(activeTrackKey(tripId, memberId))) ?? null;
  } catch {
    return null;
  }
}

export async function setCachedActiveTrackSession(session: TrackSession): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.set(activeTrackKey(session.tripId, session.memberId), session.id, {
      ex: activeTrackTtlSeconds
    });
  } catch {
    // Redis is only a helper for short-lived tracking state.
  }
}

export async function clearCachedActiveTrackSession(
  tripId: string,
  memberId: string
): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    return;
  }

  try {
    await redis.del(activeTrackKey(tripId, memberId));
  } catch {
    // Redis is only a helper for short-lived tracking state.
  }
}
