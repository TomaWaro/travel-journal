import type { CreateLegInput, LatLng, TravelMode } from "@/lib/types";

const knownLocations: Record<string, LatLng> = {
  paris: { latitude: 48.8566, longitude: 2.3522 },
  "issy-les-moulineaux": { latitude: 48.8245, longitude: 2.2742 },
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

async function fetchCoordinates(label: string): Promise<LatLng | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(label)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TravelJournalApp/1.0"
      }
    });
    const data = await response.json();
    if (Array.isArray(data) && data[0]) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error("Geocoding failed for:", label, error);
  }
  return null;
}

function parseCoordinatesFromUrl(url: string): LatLng | null {
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (match && match[1] && match[2]) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2])
    };
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

async function buildPlannedPath(stops: string[]): Promise<LatLng[]> {
  const path: LatLng[] = [];
  for (const stop of stops) {
    let coords = inferCoordinates(stop);
    if (!coords) {
      coords = await fetchCoordinates(stop);
    }
    if (coords) {
      path.push(coords);
    }
  }
  return path;
}

async function resolveShortUrl(url: string): Promise<string> {
  try {
    let currentUrl = url;

    // First check if it is a dynamic link with an embedded deep link
    try {
      const parsed = new URL(currentUrl);
      const deepLink = parsed.searchParams.get("link");
      if (deepLink) {
        currentUrl = deepLink;
      }
    } catch {
      // ignore
    }

    // Follow up to 3 redirects
    for (let i = 0; i < 3; i++) {
      const parsed = new URL(currentUrl);
      // Only fetch redirect if it's on a known short/dynamic domain or path-based directions are not present
      if (
        parsed.hostname.includes("goo.gl") ||
        parsed.hostname.includes("maps.app.goo.gl") ||
        parsed.hostname.includes("t.co") ||
        !parsed.pathname.includes("/dir/")
      ) {
        const response = await fetch(currentUrl, { method: "HEAD", redirect: "manual" });
        const location = response.headers.get("location");
        if (location) {
          currentUrl = new URL(location, currentUrl).toString();
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return currentUrl;
  } catch {
    return url;
  }
}

export async function parseGoogleMapsLeg(
  tripId: string,
  url: string,
  fallbackDayDate: string | null
): Promise<Omit<CreateLegInput, "title"> & { title: string; needsManualCorrection: boolean }> {
  let resolvedUrl = url;
  try {
    resolvedUrl = await resolveShortUrl(url);
  } catch {
    // fallback to original url
  }

  const parsed = new URL(resolvedUrl);
  let origin = "";
  let destination = "";
  let waypoints: string[] = [];
  let travelMode: TravelMode = "driving";
  let plannedPath: LatLng[] = [];

  // Case 1: Search params (API/Embed format)
  if (parsed.searchParams.has("origin") || parsed.searchParams.has("destination")) {
    origin = parsed.searchParams.get("origin") ?? "";
    destination = parsed.searchParams.get("destination") ?? "";
    waypoints = (parsed.searchParams.get("waypoints") ?? "")
      .split("|")
      .map((waypoint) => waypoint.trim())
      .filter(Boolean);
    travelMode = parseTravelMode(parsed.searchParams.get("travelmode"));
    const stops = [origin, ...waypoints, destination].filter(Boolean);
    plannedPath = await buildPlannedPath(stops);
  } else {
    // Case 2: Path-based (User sharing format: maps/dir/Lyon/Barcelona)
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const dirIndex = pathParts.indexOf("dir");
    if (dirIndex >= 0) {
      const rawStops = pathParts.slice(dirIndex + 1);
      const stops = rawStops.filter(
        (part) =>
          !part.startsWith("@") &&
          !part.startsWith("data=") &&
          !part.includes("data") &&
          !part.includes("dir")
      );
      if (stops.length >= 2) {
        origin = decodeURIComponent(stops[0]);
        destination = decodeURIComponent(stops[stops.length - 1]);
        waypoints = stops.slice(1, -1).map((w) => decodeURIComponent(w));
        const finalStops = [origin, ...waypoints, destination].filter(Boolean);
        plannedPath = await buildPlannedPath(finalStops);
      }
    }
  }

  // Fallback Case 3: If no planned path found, but coordinates are present in URL
  if (plannedPath.length === 0) {
    const coords = parseCoordinatesFromUrl(resolvedUrl);
    if (coords) {
      plannedPath = [coords, coords];
      origin = "Position en direct";
      destination = "Position en direct";
    }
  }

  const stops = [origin, ...waypoints, destination].filter(Boolean);
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
