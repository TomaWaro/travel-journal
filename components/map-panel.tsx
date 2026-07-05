"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Moment, RouteLeg, TrackPoint, Trip } from "@/lib/types";

type Props = {
  title: string;
  trip: Trip;
  legs: RouteLeg[];
  trackPoints: TrackPoint[];
  moments: Moment[];
};

const knownPlaces = [
  { label: "Issy-les-Moulineaux", latitude: 48.8245, longitude: 2.2742 },
  { label: "Paris", latitude: 48.8566, longitude: 2.3522 },
  { label: "Lyon", latitude: 45.764, longitude: 4.8357 },
  { label: "Lunel", latitude: 43.6778, longitude: 4.1361 },
  { label: "Costa Brava", latitude: 41.8481, longitude: 3.1294 },
  { label: "Barcelone", latitude: 41.3874, longitude: 2.1686 },
  { label: "Aix-en-Provence", latitude: 43.5297, longitude: 5.4474 }
] as const;

function distanceKm(
  leftLatitude: number,
  leftLongitude: number,
  rightLatitude: number,
  rightLongitude: number
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(rightLatitude - leftLatitude);
  const dLon = toRadians(rightLongitude - leftLongitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(leftLatitude)) *
      Math.cos(toRadians(rightLatitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function inferMomentLocation(moment: Moment, legs: RouteLeg[]) {
  if (moment.latitude === null || moment.longitude === null) {
    return null;
  }

  const legStops = legs.flatMap((leg) => {
    const stops: Array<{ label: string; latitude: number; longitude: number }> = [];
    const first = leg.plannedPath[0];
    const last = leg.plannedPath[leg.plannedPath.length - 1];

    if (first) {
      stops.push({ label: leg.originLabel, latitude: first.latitude, longitude: first.longitude });
    }

    if (last) {
      stops.push({ label: leg.destinationLabel, latitude: last.latitude, longitude: last.longitude });
    }

    return stops;
  });

  const closestLegStop = legStops
    .map((stop) => ({
      ...stop,
      distanceKm: distanceKm(moment.latitude!, moment.longitude!, stop.latitude, stop.longitude)
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0];

  if (closestLegStop && closestLegStop.distanceKm <= 35) {
    return closestLegStop.label;
  }

  const closestKnownPlace = knownPlaces
    .map((place) => ({
      ...place,
      distanceKm: distanceKm(moment.latitude!, moment.longitude!, place.latitude, place.longitude)
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0];

  if (closestKnownPlace && closestKnownPlace.distanceKm <= 30) {
    return closestKnownPlace.label;
  }

  return moment.caption || null;
}

function buildFeatureCollection(legs: RouteLeg[], trackPoints: TrackPoint[], moments: Moment[]) {
  const features: Array<Record<string, unknown>> = [];

  for (const leg of legs) {
    if (leg.plannedPath.length >= 2) {
      features.push({
        type: "Feature",
        properties: {
          kind: "planned",
          title: leg.title
        },
        geometry: {
          type: "LineString",
          coordinates: leg.plannedPath.map((point) => [point.longitude, point.latitude])
        }
      });
    }
  }

  if (trackPoints.length >= 2) {
    features.push({
      type: "Feature",
      properties: {
        kind: "actual",
        title: "Trajet enregistre"
      },
      geometry: {
        type: "LineString",
        coordinates: trackPoints.map((point) => [point.longitude, point.latitude])
      }
    });
  }

  for (const moment of moments) {
    if (moment.latitude !== null && moment.longitude !== null) {
      const label = inferMomentLocation(moment, legs);

      features.push({
        type: "Feature",
        properties: {
          kind: "moment",
          title: moment.caption || moment.body || "Moment",
          ...(label ? { label } : {})
        },
        geometry: {
          type: "Point",
          coordinates: [moment.longitude, moment.latitude]
        }
      });
    }
  }

  return {
    type: "FeatureCollection",
    features
  };
}

function getInitialCenter(legs: RouteLeg[], trackPoints: TrackPoint[]): [number, number] {
  const firstTrackPoint = trackPoints[0];

  if (firstTrackPoint) {
    return [firstTrackPoint.longitude, firstTrackPoint.latitude];
  }

  const firstLegPoint = legs.find((leg) => leg.plannedPath.length > 0)?.plannedPath[0];

  if (firstLegPoint) {
    return [firstLegPoint.longitude, firstLegPoint.latitude];
  }

  return [4.5, 43.8];
}

export function MapPanel({ title, trip, legs, trackPoints, moments }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let mapInstance: { remove: () => void } | null = null;

    async function mount() {
      if (!mapRef.current) {
        return;
      }

      const maplibre = await import("maplibre-gl");

      if (disposed || !mapRef.current) {
        return;
      }

      const map = new maplibre.Map({
        container: mapRef.current,
        style: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://demotiles.maplibre.org/style.json",
        center: getInitialCenter(legs, trackPoints),
        zoom: 5.1
      });

      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "top-right");
      map.on("load", () => {
        const data = buildFeatureCollection(legs, trackPoints, moments);
        map.addSource("journey", {
          type: "geojson",
          data
        });

        map.addLayer({
          id: "planned-line",
          type: "line",
          source: "journey",
          filter: ["==", ["get", "kind"], "planned"],
          paint: {
            "line-color": "#ffd166",
            "line-width": 4,
            "line-dasharray": [2, 1]
          }
        });

        map.addLayer({
          id: "actual-line",
          type: "line",
          source: "journey",
          filter: ["==", ["get", "kind"], "actual"],
          paint: {
            "line-color": "#36cfc9",
            "line-width": 5
          }
        });

        map.addLayer({
          id: "moments-points",
          type: "circle",
          source: "journey",
          filter: ["==", ["get", "kind"], "moment"],
          paint: {
            "circle-color": "#f18f5c",
            "circle-radius": 6,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fef3d4"
          }
        });

        map.addLayer({
          id: "moment-labels",
          type: "symbol",
          source: "journey",
          filter: ["all", ["==", ["get", "kind"], "moment"], ["has", "label"]],
          layout: {
            "text-field": ["get", "label"],
            "text-size": 12,
            "text-offset": [0, 1.3],
            "text-anchor": "top"
          },
          paint: {
            "text-color": "#132033",
            "text-halo-color": "#fff7ec",
            "text-halo-width": 1.2
          }
        });
      });

      mapInstance = map;
    }

    mount().catch(() => {
      // The page still renders even if the map library fails to load.
    });

    return () => {
      disposed = true;
      mapInstance?.remove();
    };
  }, [legs, moments, trackPoints, trip.id]);

  return (
    <section className="panel map-panel">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Carte</p>
          <h2>{title}</h2>
        </div>
        <p className="panel-meta">
          {trip.mapPrivacy === "delayed"
            ? `Mode quasi-public avec ${trip.mapDelayMinutes} min de delai`
            : "Mode segments termines"}
        </p>
      </div>
      <div className="map-shell" ref={mapRef} />
    </section>
  );
}
