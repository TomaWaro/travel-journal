import type { CreateLegInput, LatLng, TravelMode } from "@/lib/types";

const knownLocations: Record<string, LatLng> = {
  lyon: { latitude: 45.764, longitude: 4.8357 },
  lunel: { latitude: 43.6778, longitude: 4.1361 },
  espagne: { latitude: 41.5912, longitude: 2.5202 },
  "costa brava": { latitude: 41.8481, longitude: 3.1294 },
  barcelona: { latitude: 41.3874, longitude: 2.1686 },
  "aix-en-provence": { latitude: 43.5297, longitude: 5.4474 },
  aix: { latitude: 43.5297, longitude: 5.4474 }
};

function inferCoordinates(label: string): LatLng | null {
  const normalized = label.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  for (const [candidate, coordinates] of Object.entries(knownLocations)) {
    if (normalized.includes(candidate)) {
      return coordinates;
    }
  }

  return null;
}

function parseTravelMode(value: string | null): TravelMode {
  switch (value) {
    case "walking":
    case "transit":
    case "cycling":
      return value;
    default:
      return "driving";
  }
}

function buildPlannedPath(stops: string[]): LatLng[] {
  return stops
    .map((stop) => inferCoordinates(stop))
    .filter((coordinates): coordinates is LatLng => Boolean(coordinates));
}

export function parseGoogleMapsLeg(
  tripId: string,
  url: string,
  fallbackDayDate: string | null
): Omit<CreateLegInput, "title"> & { title: string; needsManualCorrection: boolean } {
  const parsed = new URL(url);
  const origin = parsed.searchParams.get("origin") ?? "";
  const destination = parsed.searchParams.get("destination") ?? "";
  const waypoints = (parsed.searchParams.get("waypoints") ?? "")
    .split("|")
    .map((waypoint) => waypoint.trim())
    .filter(Boolean);
  const travelMode = parseTravelMode(parsed.searchParams.get("travelmode"));
  const stops = [origin, ...waypoints, destination].filter(Boolean);
  const plannedPath = buildPlannedPath(stops);
  const title = stops.length >= 2 ? `${stops[0]} -> ${stops[stops.length - 1]}` : "Leg imported from Google Maps";

  return {
    tripId,
    dayDate: fallbackDayDate,
    title,
    originLabel: origin || "Manual departure required",
    destinationLabel: destination || "Manual arrival required",
    waypoints,
    travelMode,
    rawGoogleMapsUrl: url,
    plannedPath,
    needsManualCorrection: !origin || !destination || plannedPath.length < 2
  };
}
