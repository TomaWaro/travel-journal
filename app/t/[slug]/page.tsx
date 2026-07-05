import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnimatedSection } from "@/components/animated-section";
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
  const mediaMoments = getMomentAssetMap(publicMoments, bundle.assets);
  const momentCommentMap = new Map(
    bundle.comments
      .filter((comment) => comment.momentId)
      .map((comment) => [comment.momentId!, [] as typeof bundle.comments])
  );
  const galleryItems = mediaMoments.slice(0, 8);

  for (const comment of bundle.comments) {
    if (comment.momentId) {
      momentCommentMap.set(comment.momentId, [...(momentCommentMap.get(comment.momentId) ?? []), comment]);
    }
  }

  const currentDay =
    bundle.days.find((day) => day.date === getParisIsoDate()) ??
    (publicMoments.length > 0
      ? bundle.days.find((day) => day.date === publicMoments[publicMoments.length - 1]?.dayDate)
      : bundle.days[0]);

  return (
    <main className="shell">
      <AnimatedSection className="landing-stage" delay={60}>
        <section className="panel trip-header-simple">
          <p className="eyebrow">Carnet de route</p>
          <h1>{bundle.trip.title}</h1>
          <p className="trip-header-summary">{bundle.trip.summary}</p>
          {currentDay ? (
            <div className="trip-header-meta">
              <span className="date-badge">Jour en cours</span>
              <span className="trip-header-day">{formatDateLabel(currentDay.date)}</span>
            </div>
          ) : null}
        </section>
      </AnimatedSection>

      <AnimatedSection className="trip-experience trip-experience-simple" delay={120}>
        <section className="panel panel-cinematic" id="trip-gallery">
          <div className="section-intro">
            <div>
              <p className="eyebrow">Souvenirs</p>
              <h2>Le fil d&apos;images du voyage</h2>
            </div>
          </div>
          <PhotoGrid
            items={galleryItems.map(({ asset, moment }) => ({
              comments: momentCommentMap.get(moment.id) ?? [],
              id: moment.id,
              type: moment.type,
              title: moment.caption || moment.type,
              body: moment.body,
              tripId: bundle.trip.id,
              url: asset.url
            }))}
          />
        </section>

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
        />
        <div id="trip-comments">
          <PublicCommentsPanel comments={tripComments} tripId={bundle.trip.id} />
        </div>
      </AnimatedSection>
    </main>
  );
}
