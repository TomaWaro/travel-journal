import Link from "next/link";
import { notFound } from "next/navigation";
import { CapturePanel } from "@/components/capture-panel";
import { EditorialPanel } from "@/components/editorial-panel";
import { MapPanel } from "@/components/map-panel";
import { TimelinePanel } from "@/components/timeline-panel";
import { TripAdminPanel } from "@/components/trip-admin-panel";
import { appEnv } from "@/lib/env";
import { getDashboardView } from "@/lib/store";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ trip?: string }>;
};

export default async function AccessPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { trip: selectedTripId } = await searchParams;
  const dashboard = await getDashboardView(token);

  if (!dashboard) {
    notFound();
  }

  const selectedTrip =
    dashboard.trips.find((trip) => trip.trip.id === selectedTripId) ?? dashboard.trips[0];

  if (!selectedTrip) {
    notFound();
  }

  const publicUrl = new URL(`/t/${selectedTrip.trip.slug}`, appEnv.appUrl).toString();
  const publishedMoments = selectedTrip.moments.filter((moment) => moment.status === "published").length;

  return (
    <main className="shell">
      <section className="hero hero-cover">
        <div className="hero-copy">
          <p className="eyebrow">{dashboard.role}</p>
          <h1>{dashboard.access.workspace.name}</h1>
          <p>
            Connecte en tant que {dashboard.access.member.name}. Ici tu captures vite, tu suis la
            route, puis tu transformes la matiere du voyage en pages publiques propres.
          </p>
          <div className="hero-metrics">
            <span className="metric-chip">{dashboard.trips.length} voyage(s)</span>
            <span className="metric-chip">{selectedTrip.stories.length} post(s) publie(s)</span>
            <span className="metric-chip">{publishedMoments} moment(s) publie(s)</span>
          </div>
        </div>
        <aside className="hero-visual">
          <div className="sidebar-card">
            <span className="eyebrow">Trip selection</span>
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
          <a className="ghost-button" href={publicUrl}>
            Voir la page publique
          </a>
        </div>
        <div className="hero-banner">
          <div className="hero-copy">
            <strong>Capture terrain</strong>
            <span>Moments, GPS et media en quelques gestes.</span>
          </div>
          <div>
            <strong>Edition</strong>
            <span>Le owner garde la validation et la publication finale.</span>
          </div>
          <div>
            <strong>Public</strong>
            <span>Une page propre, partageable, lisible sur mobile.</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid" style={{ marginTop: 24 }}>
        <div className="grid">
          <CapturePanel
            blobUploadsEnabled={appEnv.blobConfigured}
            publicUrl={publicUrl}
            token={token}
            tripId={selectedTrip.trip.id}
          />
          <MapPanel
            legs={selectedTrip.legs}
            moments={selectedTrip.moments}
            title="Trajet planifie + trajet reel"
            trackPoints={selectedTrip.trackPoints}
            trip={selectedTrip.trip}
          />
          <TimelinePanel
            assets={selectedTrip.assets}
            days={selectedTrip.days}
            drafts={selectedTrip.drafts}
            members={selectedTrip.contributors}
            moments={selectedTrip.moments}
            stories={selectedTrip.stories}
          />
        </div>

        <div className="grid">
          {dashboard.role === "owner" ? (
            <TripAdminPanel
              members={selectedTrip.contributors}
              token={token}
              trip={selectedTrip.trip}
            />
          ) : null}
          {dashboard.role === "owner" ? (
            <EditorialPanel
              days={selectedTrip.days}
              drafts={selectedTrip.drafts}
              stories={selectedTrip.stories}
              token={token}
              trip={selectedTrip.trip}
            />
          ) : (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Contributeur</p>
                  <h2>Mode capture uniquement</h2>
                </div>
              </div>
              <p>
                Tu peux envoyer des moments, demarrer le suivi GPS et alimenter la timeline. La
                publication reste reservee au owner.
              </p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
