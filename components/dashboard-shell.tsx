"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CapturePanel } from "@/components/capture-panel";
import { EditorialPanel } from "@/components/editorial-panel";
import { MapPanel } from "@/components/map-panel";
import { TimelinePanel } from "@/components/timeline-panel";
import { TripAdminPanel } from "@/components/trip-admin-panel";
import type { DashboardView, TripBundle } from "@/lib/types";

type Props = {
  dashboard: DashboardView;
  selectedTrip: TripBundle | null;
  publicUrl: string | null;
  token: string;
  blobUploadsEnabled: boolean;
};

type TabKey =
  | "capture"
  | "map"
  | "timeline"
  | "settings"
  | "legs"
  | "invites"
  | "editorial";

export function DashboardShell({
  dashboard,
  selectedTrip,
  publicUrl,
  token,
  blobUploadsEnabled
}: Props) {
  const router = useRouter();
  const publishedMoments = selectedTrip
    ? selectedTrip.moments.filter((moment) => moment.status === "published").length
    : 0;
  const tabs = useMemo(() => {
    const base: Array<{ key: TabKey; label: string }> = [
      { key: "capture", label: "Capture" },
      { key: "map", label: "Carte" },
      { key: "timeline", label: "Timeline" }
    ];

    if (dashboard.role === "owner") {
      base.push(
        { key: "settings", label: "Reglages" },
        { key: "legs", label: "Itineraire" },
        { key: "invites", label: "Invitations" },
        { key: "editorial", label: "Edito" }
      );
    }

    return base;
  }, [dashboard.role]);
  const [activeTab, setActiveTab] = useState<TabKey>("capture");
  const [createMessage, setCreateMessage] = useState("");

  if (!selectedTrip) {
    return (
      <main className="shell">
        <section className="hero hero-cover workspace-hero">
          <div className="hero-copy">
            <p className="eyebrow">{dashboard.role}</p>
            <h1>{dashboard.access.workspace.name}</h1>
            <p>Le carnet est vide. Cree le premier voyage pour repartir proprement de zero.</p>
          </div>
        </section>

        <section className="workspace-shell">
          {dashboard.role === "owner" ? (
            <section className="panel">
              <div className="panel-heading workspace-panel-heading">
                <div>
                  <p className="eyebrow">Nouveau depart</p>
                  <h2>Creer le premier voyage</h2>
                </div>
              </div>
              <form
                className="workspace-form-shell"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  setCreateMessage("");
                  const response = await fetch("/api/trips", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-access-token": token
                    },
                    body: JSON.stringify({
                      title: formData.get("title"),
                      summary: formData.get("summary"),
                      startDate: formData.get("startDate"),
                      endDate: formData.get("endDate"),
                      visibility: formData.get("visibility"),
                      mapPrivacy: formData.get("mapPrivacy"),
                      mapDelayMinutes: Number(formData.get("mapDelayMinutes"))
                    })
                  });
                  const payload = (await response.json()) as { error?: string };

                  if (!response.ok) {
                    setCreateMessage(payload.error ?? "Impossible de creer le voyage.");
                    return;
                  }

                  router.refresh();
                }}
              >
                <label className="field">
                  <span>Titre</span>
                  <input name="title" placeholder="Ex: Road trip ete 2026" required type="text" />
                </label>
                <label className="field">
                  <span>Resume</span>
                  <textarea
                    name="summary"
                    placeholder="Quelques lignes pour decrire le voyage"
                    required
                    rows={4}
                  />
                </label>
                <label className="field">
                  <span>Date de debut</span>
                  <input name="startDate" required type="date" />
                </label>
                <label className="field">
                  <span>Date de fin</span>
                  <input name="endDate" required type="date" />
                </label>
                <label className="field">
                  <span>Visibilite</span>
                  <select defaultValue="quasi-public" name="visibility">
                    <option value="private">Prive</option>
                    <option value="quasi-public">Quasi-public</option>
                  </select>
                </label>
                <label className="field">
                  <span>Mode carte</span>
                  <select defaultValue="delayed" name="mapPrivacy">
                    <option value="delayed">Position retardee</option>
                    <option value="completed-only">Segments termines</option>
                  </select>
                </label>
                <label className="field">
                  <span>Delai carte (minutes)</span>
                  <input defaultValue={30} min={0} name="mapDelayMinutes" type="number" />
                </label>
                <button className="primary-button" type="submit">
                  Creer le voyage
                </button>
              </form>
              {createMessage ? <p className="status-line">{createMessage}</p> : null}
            </section>
          ) : (
            <section className="panel">
              <div className="panel-heading workspace-panel-heading">
                <div>
                  <p className="eyebrow">Aucun voyage</p>
                  <h2>Le carnet n&apos;a pas encore ete initialise</h2>
                </div>
              </div>
              <p>Le owner doit d&apos;abord creer un voyage avant que tu puisses contribuer.</p>
            </section>
          )}
        </section>
      </main>
    );
  }

  const resolvedPublicUrl = publicUrl ?? "/";

  return (
    <main className="shell">
      <section className="hero hero-cover workspace-hero">
        <div className="hero-copy">
          <p className="eyebrow">{dashboard.role}</p>
          <h1>{dashboard.access.workspace.name}</h1>
          <p>
            Connecte en tant que {dashboard.access.member.name}. L&apos;espace prive est maintenant
            organise par tache pour rester editable proprement sur telephone.
          </p>
          <div className="hero-metrics">
            <span className="metric-chip">{dashboard.trips.length} voyage(s)</span>
            <span className="metric-chip">{selectedTrip.stories.length} post(s) publie(s)</span>
            <span className="metric-chip">{publishedMoments} moment(s) publie(s)</span>
          </div>
        </div>
        <aside className="hero-visual">
          <div className="sidebar-card">
            <span className="eyebrow">Voyage actif</span>
            <h2>{selectedTrip.trip.title}</h2>
            <p>{selectedTrip.trip.summary}</p>
          </div>
        </aside>
        <div className="trip-nav">
          {dashboard.trips.map((bundle) => (
            <Link
              className={`nav-chip ${bundle.trip.id === selectedTrip.trip.id ? "active" : ""}`}
              href={`/access/${token}?trip=${bundle.trip.id}`}
              key={bundle.trip.id}
            >
              {bundle.trip.title}
            </Link>
          ))}
          {publicUrl ? (
            <a className="ghost-button" href={publicUrl}>
              Voir la page publique
            </a>
          ) : null}
        </div>
      </section>

      <section className="workspace-shell">
        <div className="workspace-tabs" role="tablist" aria-label="Onglets d'administration">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab.key}
              className={`workspace-tab ${activeTab === tab.key ? "active" : ""}`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="workspace-panel">
          {activeTab === "capture" ? (
            <CapturePanel
              blobUploadsEnabled={blobUploadsEnabled}
              publicUrl={resolvedPublicUrl}
              token={token}
              tripId={selectedTrip.trip.id}
            />
          ) : null}

          {activeTab === "map" ? (
            <MapPanel
              legs={selectedTrip.legs}
              moments={selectedTrip.moments}
              title="Trajet planifie + trajet reel"
              trackPoints={selectedTrip.trackPoints}
              trip={selectedTrip.trip}
            />
          ) : null}

          {activeTab === "timeline" ? (
            <TimelinePanel
              assets={selectedTrip.assets}
              days={selectedTrip.days}
              drafts={selectedTrip.drafts}
              members={selectedTrip.contributors}
              moments={selectedTrip.moments}
              stories={selectedTrip.stories}
            />
          ) : null}

          {dashboard.role === "owner" && activeTab === "settings" ? (
            <TripAdminPanel
              members={selectedTrip.contributors}
              mode="settings"
              token={token}
              trip={selectedTrip.trip}
            />
          ) : null}

          {dashboard.role === "owner" && activeTab === "legs" ? (
            <TripAdminPanel
              members={selectedTrip.contributors}
              mode="legs"
              token={token}
              trip={selectedTrip.trip}
            />
          ) : null}

          {dashboard.role === "owner" && activeTab === "invites" ? (
            <TripAdminPanel
              members={selectedTrip.contributors}
              mode="invites"
              token={token}
              trip={selectedTrip.trip}
            />
          ) : null}

          {dashboard.role === "owner" && activeTab === "editorial" ? (
            <EditorialPanel
              days={selectedTrip.days}
              drafts={selectedTrip.drafts}
              stories={selectedTrip.stories}
              token={token}
              trip={selectedTrip.trip}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
