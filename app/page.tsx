import Link from "next/link";
import { shouldHidePrivateAccessLinks } from "@/lib/access";
import { listPublishedTrips } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const trips = await listPublishedTrips();
  const hidePrivateAccessLinks = shouldHidePrivateAccessLinks();
  const publishedStories = trips.reduce((count, bundle) => count + bundle.stories.length, 0);
  const publishedMoments = trips.reduce((count, bundle) => count + bundle.moments.length, 0);

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">Summer Travel Journal</p>
            <h1>Un carnet de voyage vivant, solaire et facile a partager.</h1>
            <p>
              Photos, videos, texte, carte, recap du soir et commentaires publics: tout tient dans
              une experience mobile qui ressemble enfin a des vacances, pas a un outil froid.
            </p>
            <div className="hero-actions">
              {trips[0] ? (
                <Link className="primary-button" href={`/t/${trips[0].trip.slug}`}>
                  Voir le voyage en cours
                </Link>
              ) : null}
              {!hidePrivateAccessLinks ? (
                <Link className="secondary-button" href="/access/owner-demo-token">
                  Ouvrir le dashboard owner
                </Link>
              ) : null}
            </div>
            <div className="hero-metrics">
              <span className="metric-chip">{trips.length} voyage(s) publie(s)</span>
              <span className="metric-chip">{publishedStories} post(s) publics</span>
              <span className="metric-chip">{publishedMoments} souvenir(s) captures</span>
            </div>
          </div>

          <aside className="hero-visual">
            <div className="spotlight-card">
              <p className="eyebrow">Road vibe</p>
              <h2>Route, mer, chaleur, souvenirs.</h2>
              <p>
                Une narration plus editoriale, des medias mieux mis en scene, et des pages qui
                donnent envie d&apos;ouvrir la suite.
              </p>
            </div>
            <div className="sunset-strip">
              <span>Lyon</span>
              <span>Lunel</span>
              <span>Espagne</span>
              <span>Aix</span>
            </div>
          </aside>
        </div>

        <div className="hero-banner">
          <div>
            <strong>Capture mobile</strong>
            <span>Upload rapide depuis ton telephone ou celui de ton fils, sans friction.</span>
          </div>
          <div>
            <strong>Publication maitrisee</strong>
            <span>Le recap du soir reste manuel, pour garder la main sur ce qui sort.</span>
          </div>
          <div>
            <strong>Quasi-public</strong>
            <span>Le public consulte, commente, suit le voyage, sans jamais voir l&apos;admin.</span>
          </div>
        </div>

        {!hidePrivateAccessLinks ? (
          <div className="subtle-actions">
            <Link className="ghost-button" href="/access/son-demo-token">
              Voir le mode contributeur
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid" style={{ marginTop: 24 }}>
        <div className="section-intro">
          <div>
            <p className="eyebrow">Destinations publiees</p>
            <h2>Des pages faites pour etre consultees et partagees</h2>
            <p>
              Chaque voyage combine carte, timeline, galerie, recits publies et commentaires
              instantanes.
            </p>
          </div>
        </div>
        <div className="trip-grid">
          {trips.map(({ trip, stories, moments }) => (
            <article className="trip-card" key={trip.id}>
              <div className="trip-card-head">
                <div>
                  <h3>{trip.title}</h3>
                  <p>{trip.summary}</p>
                </div>
                <span>{trip.startDate}</span>
              </div>
              <div className="caption-row">
                <span>{moments.length} moments</span>
                <span>{stories.length} posts publies</span>
              </div>
              <div className="hero-actions" style={{ marginTop: 16 }}>
                <Link className="ghost-button" href={`/t/${trip.slug}`}>
                  Voir la carte publique
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
