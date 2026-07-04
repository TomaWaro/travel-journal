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
  const marqueeLocations = Array.from(
    new Set(trips.flatMap((bundle) => getTripLocations(bundle)))
  ).slice(0, 10);

  return (
    <main className="shell">
      <AnimatedSection className="landing-stage" delay={80}>
        <section className="hero hero-cover hero-launch">
          <div className="hero-noise" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">Summer issue 2026</p>
            <h1>Un journal de voyage qui se scrolle comme une edition vivante.</h1>
            <p>
              Plus proche d&apos;un feed premium, d&apos;une couverture de magazine et d&apos;un
              carnet visuel que d&apos;un site de posts. Chaque etape est traitee comme un moment
              a ressentir, pas juste a lire.
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
            <div className="scroll-cue">
              <span className="scroll-cue-line" aria-hidden="true" />
              <span>Scroll pour entrer dans le carnet</span>
            </div>
          </div>
          <aside className="hero-visual">
            <div
              className="cover-image cover-image-immersive"
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
            <div className="floating-cards">
              <div className="floating-card floating-card-primary">
                <span className="eyebrow">Mood</span>
                <strong>Sunset drive</strong>
                <p>Chaleur, route, pause, bruit de ville, air marin.</p>
              </div>
              <div className="floating-card floating-card-secondary">
                <span className="note-accent">Daily note</span>
                <p>Poster le soir, capturer a chaud, relire plus tard.</p>
              </div>
            </div>
          </aside>
          <div className="marquee-shell" aria-hidden="true">
            <div className="marquee-track">
              {(marqueeLocations.length > 0 ? marqueeLocations : ["Lyon", "Lunel", "Espagne", "Aix"]).map(
                (location) => (
                  <span key={location}>{location}</span>
                )
              )}
              {(marqueeLocations.length > 0 ? marqueeLocations : ["Lyon", "Lunel", "Espagne", "Aix"]).map(
                (location) => (
                  <span key={`${location}-dup`}>{location}</span>
                )
              )}
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

      <AnimatedSection className="issue-summary" delay={120}>
        <section className="immersive-panel summary-panel">
          <div className="summary-grid">
            <div className="section-intro">
              <div>
                <p className="eyebrow">This edition</p>
                <h2>Une presentation plus proche d&apos;Instagram que d&apos;un blog.</h2>
                <p>
                  Couvertures visuelles, rythme fort, cartes de recits, enchainement clair, gros
                  tap targets, hierarchie simple et scan immediate.
                </p>
              </div>
            </div>
            <div className="hero-banner summary-ribbon">
              <div>
                <strong>Motion-rich</strong>
                <span>Sections qui revelent, fond vivant, cartes qui flottent.</span>
              </div>
              <div>
                <strong>Photo-driven</strong>
                <span>Les medias prennent le lead, le texte vient soutenir.</span>
              </div>
              <div>
                <strong>Human</strong>
                <span>Details manuscrits, palette chaude, composition moins rigide.</span>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection className="grid issue-feed" delay={140}>
        <div className="section-intro">
          <div>
            <p className="eyebrow">Featured journeys</p>
            <h2>Les couvertures du voyage</h2>
            <p>
              Chaque voyage se lit comme un numero: une route, une ambiance, des recits, puis des
              images qui prennent le relais.
            </p>
          </div>
        </div>
        <div className="immersive-feed">
          {trips.map((bundle, index) => (
            <div className={`feature-row ${index % 2 === 1 ? "feature-row-reverse" : ""}`} key={bundle.trip.id}>
              <ArticleCard
                date={formatDateLabel(bundle.trip.startDate)}
                href={`/t/${bundle.trip.slug}`}
                imageUrl={getCoverPhoto(bundle)}
                location={getTripLocations(bundle)[0]}
                stats={`${bundle.moments.length} souvenirs · ${bundle.stories.length} recits`}
                summary={bundle.trip.summary}
                title={bundle.trip.title}
              />
              <div className="feature-copy">
                <span className="note-accent">Issue {String(index + 1).padStart(2, "0")}</span>
                <h3>{bundle.trip.title}</h3>
                <p>{bundle.trip.summary}</p>
                <div className="feature-locations">
                  {getTripLocations(bundle).map((location) => (
                    <LocationBadge key={location}>{location}</LocationBadge>
                  ))}
                </div>
                <Link className="primary-button" href={`/t/${bundle.trip.slug}`}>
                  Entrer dans l&apos;edition
                </Link>
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="home-feature-grid" delay={180}>
        <div className="section-intro">
          <div>
            <p className="eyebrow">Journal</p>
            <h2>Derniers recits et timeline d&apos;etapes</h2>
          </div>
        </div>
        <div className="home-editorial-grid">
          <div className="story-stack story-stack-featured">
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
          <div className="timeline-preview timeline-preview-immersive">
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
