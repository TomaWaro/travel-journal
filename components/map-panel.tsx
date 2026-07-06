"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
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

function buildFeatureCollection(legs: RouteLeg[], trackPoints: TrackPoint[], moments: Moment[], trip: Trip) {
  const features: Array<Record<string, unknown>> = [];

  // Parse and display the global live tracking route line string on the map
  const todayStr = new Date().toISOString().slice(0, 10);
  const isTripActive = !trip.endDate || trip.endDate >= todayStr;
  
  const liveCoords: [number, number][] = [];
  if (isTripActive && trip.liveTrackingUrl && trip.liveTrackingPath) {
    try {
      const coords = JSON.parse(trip.liveTrackingPath) as { latitude: number; longitude: number }[];
      if (coords.length >= 2) {
        for (const c of coords) {
          liveCoords.push([c.longitude, c.latitude]);
        }
      }
    } catch (e) {
      console.error("Failed to parse liveTrackingPath:", e);
    }
  }

  // Gather planned path coordinates from manually configured legs
  const plannedCoords: [number, number][] = [];
  for (const leg of legs) {
    for (const pt of leg.plannedPath) {
      plannedCoords.push([pt.longitude, pt.latitude]);
    }
  }

  // Fallback: If no legs have coordinate points, build a route line by connecting 
  // all text & photo moments sequentially in chronological order.
  if (plannedCoords.length === 0) {
    const sortedMoments = [...moments]
      .filter((m) => m.longitude !== null && m.latitude !== null)
      .sort((a, b) => {
        const dateA = a.dayDate || a.createdAt;
        const dateB = b.dayDate || b.createdAt;
        return dateA.localeCompare(dateB);
      });
    for (const m of sortedMoments) {
      plannedCoords.push([m.longitude!, m.latitude!]);
    }
  }

  // Render the planned itinerary route line
  if (plannedCoords.length >= 2) {
    features.push({
      type: "Feature",
      properties: {
        kind: "planned",
        title: "Itinéraire"
      },
      geometry: {
        type: "LineString",
        coordinates: plannedCoords
      }
    });
  }

  // Render the live tracking route line (if present)
  if (liveCoords.length >= 2) {
    features.push({
      type: "Feature",
      properties: {
        kind: "planned",
        title: "Suivi en direct"
      },
      geometry: {
        type: "LineString",
        coordinates: liveCoords
      }
    });
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
  // Use the global live tracking URL of the trip, which automatically hides if the trip is finished
  const todayStr = new Date().toISOString().slice(0, 10);
  const isTripActive = !trip.endDate || trip.endDate >= todayStr;
  const liveTrackingUrl = isTripActive ? trip.liveTrackingUrl : null;

  const hasItinerary = legs.length > 0 || trackPoints.length > 0;
  const initialTab = liveTrackingUrl ? "route" : "moments";
  const [activeTab, setActiveTab] = useState<"moments" | "route">(initialTab);
  const mapInstanceRef = useRef<any>(null);

  // React to tab changes and adjust layer visibilities
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }

    const updateVisibility = () => {
      try {
        if (map.getLayer("planned-line")) {
          // Keep planned route line always visible to show the path
          map.setLayoutProperty("planned-line", "visibility", "visible");
        }
        if (map.getLayer("actual-line")) {
          map.setLayoutProperty("actual-line", "visibility", activeTab === "route" ? "visible" : "none");
        }
        if (map.getLayer("moments-points")) {
          map.setLayoutProperty("moments-points", "visibility", activeTab === "moments" ? "visible" : "none");
        }
        if (map.getLayer("moment-labels")) {
          map.setLayoutProperty("moment-labels", "visibility", activeTab === "moments" ? "visible" : "none");
        }
      } catch (e) {
        console.error("Failed to update layer visibility:", e);
      }
    };

    if (map.isStyleLoaded()) {
      updateVisibility();
    } else {
      map.once("idle", updateVisibility);
    }
  }, [activeTab]);

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
        style: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        center: getInitialCenter(legs, trackPoints),
        zoom: 5.1
      });

      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "top-right");
      map.on("load", () => {
        const data = buildFeatureCollection(legs, trackPoints, moments, trip);
        map.addSource("journey", {
          type: "geojson",
          data
        });

        map.addLayer({
          id: "planned-line",
          type: "line",
          source: "journey",
          filter: ["==", ["get", "kind"], "planned"],
          layout: {
            visibility: "visible",
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#1a73e8",
            "line-width": 8
          }
        });

        map.addLayer({
          id: "actual-line",
          type: "line",
          source: "journey",
          filter: ["==", ["get", "kind"], "actual"],
          layout: {
            visibility: initialTab === "route" ? "visible" : "none"
          },
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
          layout: {
            visibility: initialTab === "moments" ? "visible" : "none"
          },
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
            "text-anchor": "top",
            visibility: initialTab === "moments" ? "visible" : "none"
          },
          paint: {
            "text-color": "#132033",
            "text-halo-color": "#fff7ec",
            "text-halo-width": 1.2
          }
        });

        // Fit camera viewport bounds to cover all trajectory coordinates
        const allCoords: [number, number][] = [];
        for (const leg of legs) {
          for (const pt of leg.plannedPath) {
            allCoords.push([pt.longitude, pt.latitude]);
          }
        }
        for (const pt of trackPoints) {
          allCoords.push([pt.longitude, pt.latitude]);
        }
        for (const m of moments) {
          if (m.longitude !== null && m.latitude !== null) {
            allCoords.push([m.longitude, m.latitude]);
          }
        }

        if (allCoords.length > 0) {
          const bounds = allCoords.reduce(
            (acc, coord) => {
              return [
                [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
                [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])]
              ];
            },
            [[allCoords[0][0], allCoords[0][1]], [allCoords[0][0], allCoords[0][1]]]
          );
          
          map.fitBounds(bounds as [[number, number], [number, number]], {
            padding: 40,
            maxZoom: 12
          });
        }

        mapInstanceRef.current = map;
      });

      mapInstance = map;
    }

    mount().catch(() => {
      // The page still renders even if the map library fails to load.
    });

    return () => {
      disposed = true;
      mapInstance?.remove();
      mapInstanceRef.current = null;
    };
  }, [legs, moments, trackPoints, trip, initialTab]);

  return (
    <section className="panel map-panel">
      <div className="section-intro map-panel-header">
        <div>
          <p className="eyebrow">Carte</p>
          <h2>{title}</h2>
        </div>

        {hasItinerary ? (
          <div className="map-tabs">
            <button
              className={`map-tab-button ${activeTab === "moments" ? "active" : ""}`}
              onClick={() => setActiveTab("moments")}
              type="button"
            >
              📸 Souvenirs
            </button>
            <button
              className={`map-tab-button ${activeTab === "route" ? "active" : ""}`}
              onClick={() => setActiveTab("route")}
              type="button"
            >
              🚗 Trajet & Suivi
            </button>
          </div>
        ) : null}
      </div>

      <div className="map-relative-container">
        <div className="map-shell" ref={mapRef} />
        
        {activeTab === "route" && liveTrackingUrl ? (
          <div className="live-status-pill">
            <span className="live-pulse-dot" />
            <span className="live-status-text">DIRECT ACTIF</span>
          </div>
        ) : activeTab === "route" ? (
          <div className="live-status-pill inactive">
            <span className="live-pulse-dot" style={{ background: "#94a3b8" }} />
            <span className="live-status-text">DIRECT INACTIF</span>
          </div>
        ) : null}

        {activeTab === "route" && liveTrackingUrl ? (
          <div className="live-tracking-card-overlay">
            <div className="live-card-badge">LIVE 🌐</div>
            <div className="live-card-info">
              <h3>Suivi de l&apos;itinéraire</h3>
              <p>Progression en direct, heure d&apos;arrivée estimée (ETA) et tracé Google Maps.</p>
            </div>
            <a
              href={liveTrackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-button live-card-action"
            >
              Suivre sur Google Maps ➔
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
