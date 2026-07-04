import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPanel } from "@/components/map-panel";
import { PublicCommentsPanel } from "@/components/public-comments-panel";
import { TimelinePanel } from "@/components/timeline-panel";
import { appEnv } from "@/lib/env";
import { filterPublicMoments, filterPublicTrackPoints } from "@/lib/public-view";
import { getPublicTripBySlug } from "@/lib/store";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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
      images: [new URL("/app-icon.svg", appEnv.appUrl).toString()]
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
        </div>
      </section>

      <section className="grid" style={{ marginTop: 24 }}>
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
        <PublicCommentsPanel comments={tripComments} tripId={bundle.trip.id} />
      </section>
    </main>
  );
}
