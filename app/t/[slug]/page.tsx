import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimatedSection } from "@/components/animated-section";
import { ArticleCard } from "@/components/article-card";
import { DateBadge, LocationBadge } from "@/components/editorial-badges";
import { MapPanel } from "@/components/map-panel";
import { PhotoGrid } from "@/components/photo-grid";
import { PublicCommentsPanel } from "@/components/public-comments-panel";
import { TimelinePanel } from "@/components/timeline-panel";
import { appEnv } from "@/lib/env";
import { formatDateLabel } from "@/lib/date";
import { filterPublicMoments, filterPublicTrackPoints } from "@/lib/public-view";
import { getPublicTripBySlug } from "@/lib/store";
import type { Asset, Moment } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function getMomentAssetMap(moments: Moment[], assets: Asset[]) {
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  return moments.reduce<Array<{ asset: Asset; moment: Moment }>>((current, moment) => {
    if (!moment.assetId) {
      return current;
    }

    const asset = assetMap.get(moment.assetId);

    if (!asset) {
      return current;
    }

    current.push({ asset, moment });
    return current;
  }, []);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getPublicTripBySlug(slug);

  if (!bundle) {
    return {
      title: "Trip not found"
    };
  }

  return {
    title: bundle.trip.title,
    description: bundle.trip.summary,
    openGraph: {
      title: bundle.trip.title,
      description: bundle.trip.summary,
      images: [
        getMomentAssetMap(filterPublicMoments(bundle.moments), bundle.assets).find(
          ({ moment }) => moment.type === "photo"
        )?.asset.url ?? new URL("/app-icon.svg", appEnv.appUrl).toString()
      ]
    }
  };
}

export default async function PublicTripPage({ params }: PageProps) {
  const { slug } = await params;
  const bundle = await getPublicTripBySlug(slug);

  if (!bundle) {
    notFound();
  }

  const publicMoments = filterPublicMoments(bundle.moments);
  const publicTrackPoints = filterPublicTrackPoints(
    bundle.trip,
    bundle.trackPoints,
    bundle.trackSessions
  );
  const tripComments = bundle.comments.filter((comment) => comment.storyId === null);
  const mediaMoments = getMomentAssetMap(publicMoments, bundle.assets);
  const galleryItems = mediaMoments.slice(0, 8);
  const storyCommentCounts = new Map(
    bundle.comments
      .filter((comment) => comment.storyId)
      .map((comment) => [comment.storyId!, 0])
  );

  for (const comment of bundle.comments) {
    if (comment.storyId) {
      storyCommentCounts.set(comment.storyId, (storyCommentCounts.get(comment.storyId) ?? 0) + 1);
    }
  }

  const leadImage = mediaMoments.find(({ moment }) => moment.type === "photo")?.asset.url ?? null;
  const routeLocations = Array.from(
    new Set(bundle.legs.flatMap((leg) => [leg.originLabel, leg.destinationLabel]).filter(Boolean))
  );
  const itinerary = bundle.legs.slice(0, 6).map((leg) => ({
    id: leg.id,
    date: leg.dayDate ? formatDateLabel(leg.dayDate) : "Etape libre",
    title: leg.title,
    location: `${leg.originLabel} → ${leg.destinationLabel}`,
    note: leg.travelMode === "driving" ? "Sur la route" : "En mouvement"
  }));

  return (
    <main className="shell">
      <AnimatedSection className="landing-stage" delay={60}>
        <section className="hero hero-cover hero-launch hero-trip">
          <div className="hero-noise" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">Travel issue</p>
            <h1>{bundle.trip.title}</h1>
            <p>{bundle.trip.summary}</p>
            <div className="cover-meta-row">
              <DateBadge>{formatDateLabel(bundle.trip.startDate)}</DateBadge>
              {routeLocations[0] ? <LocationBadge>{routeLocations[0]}</LocationBadge> : null}
            </div>
            <div className="hero-actions">
              <Link className="ghost-button" href="/">
                Retour a l&apos;accueil
              </Link>
              <a className="primary-button" href="#trip-comments">
                Reagir au voyage
              </a>
            </div>
            <div className="hero-metrics">
              <span className="metric-chip">{publicMoments.length} souvenir(s)</span>
              <span className="metric-chip">{bundle.stories.length} recit(s)</span>
              <span className="metric-chip">{tripComments.length} reaction(s)</span>
            </div>
            <div className="scroll-cue">
              <span className="scroll-cue-line" aria-hidden="true" />
              <span>Entrer dans le carnet</span>
            </div>
          </div>
          <aside className="hero-visual">
            <div
              className="cover-image cover-image-immersive"
              style={
                leadImage
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(16, 27, 43, 0.06), rgba(16, 27, 43, 0.28)), url(${leadImage})`
                    }
                  : undefined
              }
            >
              <div className="cover-image-note">
                <span className="note-accent">Carnet d&apos;ete</span>
                <strong>{routeLocations.slice(0, 3).join(" · ") || "Route a suivre"}</strong>
                <p>{bundle.trip.visibility === "quasi-public" ? "Page quasi-publique" : "Page publique"}</p>
              </div>
            </div>
            <div className="floating-cards">
              <div className="floating-card floating-card-primary">
                <span className="eyebrow">Live edition</span>
                <strong>{bundle.trip.mapPrivacy === "delayed" ? "Trajet differe" : "Etapes terminees"}</strong>
                <p>{bundle.trip.mapDelayMinutes} min de delai quand le suivi public est actif.</p>
              </div>
            </div>
          </aside>
          <div className="marquee-shell" aria-hidden="true">
            <div className="marquee-track">
              {(routeLocations.length > 0 ? routeLocations : ["Route", "Voyage", "Mer"]).map((location) => (
                <span key={location}>{location}</span>
              ))}
              {(routeLocations.length > 0 ? routeLocations : ["Route", "Voyage", "Mer"]).map((location) => (
                <span key={`${location}-dup`}>{location}</span>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection className="trip-experience" delay={120}>
        <section className="trip-storyline-grid">
          <aside className="chapter-rail">
            <span className="eyebrow">Chapitres</span>
            <div className="chapter-rail-list">
              <a href="#trip-itinerary">Itineraire</a>
              <a href="#trip-gallery">Galerie</a>
              <a href="#trip-map">Carte</a>
              <a href="#trip-stories">Recits</a>
              <a href="#trip-comments">Commentaires</a>
            </div>
          </aside>
          <div className="trip-storyline">
        <section className="editorial-lead immersive-panel" id="trip-itinerary">
          <div className="section-intro">
            <div>
              <p className="eyebrow">Apercu</p>
              <h2>Une narration par etapes, comme un reel editorial.</h2>
            </div>
          </div>
          <div className="itinerary-strip">
            {itinerary.length === 0 ? (
              <div className="empty-state">
                <strong>L&apos;itineraire apparaitra ici.</strong>
                <p>Ajoute des etapes Google Maps pour remplir ce bandeau de voyage.</p>
              </div>
            ) : null}
            {itinerary.map((stop) => (
              <div className="itinerary-chip itinerary-chip-glow" key={stop.id}>
                <DateBadge>{stop.date}</DateBadge>
                <strong>{stop.title}</strong>
                <span>{stop.location}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel panel-cinematic" id="trip-gallery">
          <div className="section-intro">
            <div>
              <p className="eyebrow">Galerie</p>
              <h2>Les images prennent le lead.</h2>
            </div>
          </div>
          <PhotoGrid
            items={galleryItems.map(({ asset, moment }) => ({
              id: moment.id,
              type: moment.type,
              title: moment.caption || moment.type,
              body: moment.body,
              url: asset.url
            }))}
          />
        </section>

        <div id="trip-map">
        <MapPanel
          legs={bundle.legs}
          moments={publicMoments}
          title="Ou nous allons / ou nous sommes deja passes"
          trackPoints={publicTrackPoints}
          trip={bundle.trip}
        />
        </div>

        <section className="panel panel-cinematic" id="trip-stories">
          <div className="section-intro">
            <div>
              <p className="eyebrow">Recits</p>
              <h2>Le voyage en chapitres visuels</h2>
            </div>
          </div>
          <div className="article-rail">
            {bundle.stories.map((story) => (
              <ArticleCard
                date={new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
                  new Date(story.publishedAt)
                )}
                href={`/posts/${story.slug}`}
                imageUrl={leadImage}
                key={story.id}
                location={routeLocations[0]}
                stats={`${storyCommentCounts.get(story.id) ?? 0} commentaire(s)`}
                summary={story.summary}
                title={story.title}
              />
            ))}
          </div>
        </section>

        <TimelinePanel
          assets={bundle.assets}
          days={bundle.days}
          drafts={[]}
          members={bundle.contributors}
          moments={publicMoments}
          showEmptyDays={false}
          stories={bundle.stories}
        />
        <div id="trip-comments">
          <PublicCommentsPanel comments={tripComments} tripId={bundle.trip.id} />
        </div>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
