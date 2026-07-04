import Link from "next/link";
import { shouldHidePrivateAccessLinks } from "@/lib/access";
import { listPublishedTrips } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const trips = await listPublishedTrips();
  const hidePrivateAccessLinks = shouldHidePrivateAccessLinks();

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Travel Journal</p>
          <h1>Une app de voyage a capter, publier et reutiliser.</h1>
          <p>
            Capture mobile, carte du trajet, brouillons du soir, pages publiques partageables. Le
            produit est pense pour ce voyage, puis pour les suivants.
          </p>
        </div>
        {!hidePrivateAccessLinks ? (
          <div className="hero-actions">
            <Link className="primary-button" href="/access/owner-demo-token">
              Ouvrir le dashboard owner
            </Link>
            <Link className="secondary-button" href="/access/son-demo-token">
              Voir le mode contributeur
            </Link>
          </div>
        ) : null}
        <div className="hero-banner">
          <strong>{hidePrivateAccessLinks ? "Mode public" : "Mode adaptable"}</strong>
          <span>
            {hidePrivateAccessLinks
              ? "Cette page ne montre que le voyage public. Les surfaces privees de contribution et d'administration ne sont pas exposees ici."
              : "Sans base configuree, l&apos;app tourne sur le seed local. Avec Neon, Blob et Redis, elle bascule automatiquement sur le mode Vercel."}
          </span>
        </div>
      </section>

      <section className="grid" style={{ marginTop: 24 }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Public trips</p>
            <h2>Voyages visibles</h2>
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
