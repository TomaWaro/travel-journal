import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnimatedSection } from "@/components/animated-section";
import { MapPanel } from "@/components/map-panel";
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

function getParisIsoDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
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
  const tripComments = bundle.comments.filter((comment) => comment.storyId === null && comment.momentId === null);
  const currentDay =
    bundle.days.find((day) => day.date === getParisIsoDate()) ??
    (publicMoments.length > 0
      ? bundle.days.find((day) => day.date === publicMoments[publicMoments.length - 1]?.dayDate)
      : bundle.days[0]);

  const isSpainTrip = slug.includes("paris-a-l-espagne");
  const displaySummary = isSpainTrip 
    ? "Le grand départ ! 1700 km de bitume chaud, du soleil, des rires, un copilote survolté et de l'Espagne en ligne de mire. ¡Vamos! 🚗💨"
    : bundle.trip.summary;

  return (
    <main className="shell" style={{ position: "relative" }}>
      {/* Scrapbook Floating Stamps/Stickers in margins */}
      <div className="scrapbook-sticker sun-sticker" title="Sol de España">☀️</div>
      <div className="scrapbook-sticker guitar-sticker" title="Guitarra española">🎸</div>
      <div className="scrapbook-sticker dancer-sticker" title="Flamenco">💃</div>
      <div className="scrapbook-sticker wine-sticker" title="Tinto de verano">🍷</div>
      <div className="scrapbook-sticker bull-sticker" title="Toro de lidia">🐂</div>
      <div className="scrapbook-sticker olives-sticker" title="Aceitunas de mesa">🫒</div>
      <div className="scrapbook-sticker fan-sticker" title="Abanico">🪭</div>
      <div className="scrapbook-sticker grapes-sticker" title="Uvas de España">🍇</div>
      <div className="scrapbook-sticker pepper-sticker" title="Pimiento picante">🌶️</div>
      <div className="scrapbook-sticker sailboat-sticker" title="Velero mediterráneo">⛵</div>

      <AnimatedSection className="landing-stage" delay={60}>
        <section className="trip-header-simple" style={{ position: "relative", textAlign: "center", padding: "20px 20px 40px 20px" }}>
          <p className="eyebrow">Carnet de route 🇪🇸</p>
          <h1>{bundle.trip.title} ☀️⛵</h1>
          <div className="spanish-flag-divider" />
          
          {displaySummary ? (
            <div className="trip-description-tape-note">
              <div className="washi-tape-scotch-giant" />
              <p className="trip-header-summary">{displaySummary}</p>
            </div>
          ) : null}

          {currentDay ? (
            <div className="trip-header-meta" style={{ marginTop: "32px", display: "flex", justifyContent: "center", gap: "12px", alignItems: "center" }}>
              <span className="date-badge">Jour en cours</span>
              <span className="trip-header-day" style={{ fontFamily: "var(--font-note), cursive", fontSize: "1.6rem", color: "var(--ink-soft)" }}>{formatDateLabel(currentDay.date)}</span>
            </div>
          ) : null}
        </section>
      </AnimatedSection>

      <AnimatedSection className="trip-experience trip-experience-simple" delay={120}>
        <div id="trip-map">
          <MapPanel
            legs={bundle.legs}
            moments={publicMoments}
            title="Carte du voyage"
            trackPoints={publicTrackPoints}
            trip={bundle.trip}
          />
        </div>

        <TimelinePanel
          assets={bundle.assets}
          days={bundle.days}
          drafts={[]}
          members={bundle.contributors}
          moments={publicMoments}
          showEmptyDays={false}
          stories={[]}
          comments={bundle.comments}
          tripId={bundle.trip.id}
        />
        <div id="trip-comments">
          <PublicCommentsPanel comments={tripComments} tripId={bundle.trip.id} />
        </div>
      </AnimatedSection>
    </main>
  );
}
