import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPanel } from "@/components/map-panel";
import { PublicCommentsPanel } from "@/components/public-comments-panel";
import { TimelinePanel } from "@/components/timeline-panel";
import { appEnv } from "@/lib/env";
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

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Quasi-public trip</p>
          <h1>{bundle.trip.title}</h1>
          <p>{bundle.trip.summary}</p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-button" href="/">
            Retour a l&apos;accueil
          </Link>
          <a className="ghost-button" href="#trip-comments">
            Reagir au voyage
          </a>
        </div>
        <div className="hero-metrics">
          <span className="metric-chip">{publicMoments.length} moment(s) publies</span>
          <span className="metric-chip">{bundle.stories.length} post(s)</span>
          <span className="metric-chip">{tripComments.length} commentaire(s)</span>
        </div>
      </section>

      <section className="grid" style={{ marginTop: 24 }}>
        {galleryItems.length > 0 ? (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Galerie</p>
                <h2>Moments a voir</h2>
              </div>
            </div>
            <div className="media-gallery">
              {galleryItems.map(({ asset, moment }) => (
                <article className="gallery-card" key={moment.id}>
                  {moment.type === "photo" ? (
                    <Image
                      alt={moment.caption || "Photo du voyage"}
                      height={960}
                      loading="lazy"
                      src={asset.url}
                      width={1280}
                    />
                  ) : moment.type === "video" ? (
                    <video controls playsInline preload="metadata" src={asset.url} />
                  ) : (
                    <audio controls preload="metadata" src={asset.url} />
                  )}
                  <div className="gallery-copy">
                    <strong>{moment.caption || moment.type}</strong>
                    {moment.body ? <p>{moment.body}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <MapPanel
          legs={bundle.legs}
          moments={publicMoments}
          title="Ou nous allons / ou nous sommes deja passes"
          trackPoints={publicTrackPoints}
          trip={bundle.trip}
        />
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Stories</p>
              <h2>Posts publies</h2>
            </div>
          </div>
          <div className="story-grid">
            {bundle.stories.map((story) => (
              <article className="story-card" key={story.id}>
                <h3>{story.title}</h3>
                <p>{story.summary}</p>
                <div className="caption-row">
                  <span>{storyCommentCounts.get(story.id) ?? 0} commentaire(s)</span>
                </div>
                <Link className="ghost-button" href={`/posts/${story.slug}`}>
                  Lire le post
                </Link>
              </article>
            ))}
          </div>
        </section>
        <TimelinePanel
          assets={bundle.assets}
          days={bundle.days}
          drafts={[]}
          members={bundle.contributors}
          moments={publicMoments}
          stories={bundle.stories}
        />
        <div id="trip-comments">
          <PublicCommentsPanel comments={tripComments} tripId={bundle.trip.id} />
        </div>
      </section>
    </main>
  );
}
