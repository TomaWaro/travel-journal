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
      features.push({
        type: "Feature",
        properties: {
          kind: "moment",
          title: moment.caption || moment.body || "Moment"
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
      <div className="panel-heading">
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
