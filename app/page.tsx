import { AnimatedSection } from "@/components/animated-section";
import { ArticleCard } from "@/components/article-card";
import { DateBadge, LocationBadge } from "@/components/editorial-badges";
import Link from "next/link";
import { shouldHidePrivateAccessLinks } from "@/lib/access";
import { formatDateLabel } from "@/lib/date";
import { listPublishedTrips } from "@/lib/store";
import type { TripBundle } from "@/lib/types";

export const dynamic = "force-dynamic";

function getCoverPhoto(bundle: TripBundle) {
  const photoMoment = bundle.moments.find((moment) => moment.type === "photo" && moment.assetId);

  if (!photoMoment?.assetId) {
    return null;
  }

  return bundle.assets.find((asset) => asset.id === photoMoment.assetId)?.url ?? null;
}

function getTripLocations(bundle: TripBundle) {
  const locations = bundle.legs.flatMap((leg) => [leg.originLabel, leg.destinationLabel]).filter(Boolean);

  return Array.from(new Set(locations)).slice(0, 3);
}

export default async function HomePage() {
  const trips = await listPublishedTrips();
  const hidePrivateAccessLinks = shouldHidePrivateAccessLinks();
  const publishedStories = trips.reduce((count, bundle) => count + bundle.stories.length, 0);
  const publishedMoments = trips.reduce((count, bundle) => count + bundle.moments.length, 0);
  const featuredTrip = trips[0];
  const coverUrl = featuredTrip ? getCoverPhoto(featuredTrip) : null;
  const coverLocations = featuredTrip ? getTripLocations(featuredTrip) : [];
  const latestStories = trips
    .flatMap((bundle) =>
      bundle.stories.map((story) => ({
        bundle,
        story,
        imageUrl:
          bundle.assets.find((asset) => {
            const sourceMoment = bundle.moments.find(
              (moment) =>
                moment.assetId === asset.id &&
                moment.type === "photo" &&
                story.slug.includes(moment.dayDate.replaceAll("-", ""))
            );

            return Boolean(sourceMoment);
          })?.url ?? getCoverPhoto(bundle)
      }))
    )
    .slice(0, 4);
  const timelineMoments = trips.flatMap((bundle) =>
    bundle.moments
      .filter((moment) => moment.status === "published")
      .slice(0, 2)
      .map((moment) => ({ bundle, moment }))
  );

  return (
    <main className="shell">
      <AnimatedSection className="cover-hero">
        <section className="hero hero-cover">
          <div className="hero-copy">
            <p className="eyebrow">Editorial Travel Journal</p>
            <h1>Le voyage devient un magazine vivant.</h1>
            <p>
              Une couverture, des etapes, des images fortes, une timeline, des recits publies et
              des commentaires publics. Le tout avec une vraie presence editoriale.
            </p>
            <div className="cover-meta-row">
              {featuredTrip ? <DateBadge>{formatDateLabel(featuredTrip.trip.startDate)}</DateBadge> : null}
              {coverLocations[0] ? <LocationBadge>{coverLocations[0]}</LocationBadge> : null}
            </div>
            <div className="hero-actions">
              {trips[0] ? (
                <Link className="primary-button" href={`/t/${trips[0].trip.slug}`}>
                  Ouvrir la couverture du voyage
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
            <div
              className="cover-image"
              style={
                coverUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(16, 27, 43, 0.08), rgba(16, 27, 43, 0.34)), url(${coverUrl})`
                    }
                  : undefined
              }
            >
              <div className="cover-image-note">
                <span className="note-accent">Roadbook</span>
                <strong>{featuredTrip?.trip.title ?? "Voyage a venir"}</strong>
                <p>{featuredTrip?.trip.summary ?? "Le prochain carnet commencera ici."}</p>
              </div>
            </div>
            <div className="sunset-strip">
              {coverLocations.length > 0 ? (
                coverLocations.map((location) => <span key={location}>{location}</span>)
              ) : (
                <>
                  <span>Depart</span>
                  <span>Route</span>
                  <span>Mer</span>
                </>
              )}
            </div>
          </aside>
          <div className="hero-banner">
            <div>
              <strong>Photo-first</strong>
              <span>La couverture donne tout de suite le ton du voyage.</span>
            </div>
            <div>
              <strong>Recit maitrise</strong>
              <span>Les posts restent valides manuellement avant publication.</span>
            </div>
            <div>
              <strong>Journal partageable</strong>
              <span>Chaque page reste lisible, belle et rapide sur mobile.</span>
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
      </AnimatedSection>

      <AnimatedSection className="grid">
        <div className="section-intro">
          <div>
            <p className="eyebrow">Edition en cours</p>
            <h2>Les couvertures du voyage</h2>
            <p>
              Chaque voyage se lit comme un numero: une route, une ambiance, des recits, puis des
              images qui prennent le relais.
            </p>
          </div>
        </div>
        <div className="article-rail">
          {trips.map((bundle) => (
            <ArticleCard
              date={formatDateLabel(bundle.trip.startDate)}
              href={`/t/${bundle.trip.slug}`}
              imageUrl={getCoverPhoto(bundle)}
              key={bundle.trip.id}
              location={getTripLocations(bundle)[0]}
              stats={`${bundle.moments.length} souvenirs · ${bundle.stories.length} recits`}
              summary={bundle.trip.summary}
              title={bundle.trip.title}
            />
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="home-feature-grid">
        <div className="section-intro">
          <div>
            <p className="eyebrow">Journal</p>
            <h2>Derniers recits et timeline d&apos;etapes</h2>
          </div>
        </div>
        <div className="home-editorial-grid">
          <div className="story-stack">
            {latestStories.length === 0 ? (
              <div className="empty-state">
                <strong>Les recits publics apparaitront ici.</strong>
                <p>La home deviendra une couverture vivante a mesure que les posts seront publies.</p>
              </div>
            ) : null}
            {latestStories.map(({ bundle, story, imageUrl }) => (
              <ArticleCard
                date={new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                  new Date(story.publishedAt)
                )}
                href={`/posts/${story.slug}`}
                imageUrl={imageUrl}
                key={story.id}
                location={getTripLocations(bundle)[0]}
                stats={`${bundle.comments.filter((comment) => comment.storyId === story.id).length} commentaire(s)`}
                summary={story.summary}
                title={story.title}
              />
            ))}
          </div>
          <div className="timeline-preview">
            <div className="timeline-preview-head">
              <span className="eyebrow">Itineraire</span>
              <p>Un apercu du rythme du voyage, stop apres stop.</p>
            </div>
            {timelineMoments.slice(0, 5).map(({ bundle, moment }) => (
              <div className="timeline-preview-item" key={moment.id}>
                <DateBadge>{formatDateLabel(moment.dayDate)}</DateBadge>
                <strong>{moment.caption || bundle.trip.title}</strong>
                <p>{moment.body || bundle.trip.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </main>
  );
}
