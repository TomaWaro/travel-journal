import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimatedSection } from "@/components/animated-section";
import { DateBadge, LocationBadge } from "@/components/editorial-badges";
import { PhotoGrid } from "@/components/photo-grid";
import { PublicCommentsPanel } from "@/components/public-comments-panel";
import { QuoteBlock } from "@/components/quote-block";
import { formatDateLabel } from "@/lib/date";
import { appEnv } from "@/lib/env";
import { getPublishedStoryBySlug } from "@/lib/store";
import type { Asset, Moment } from "@/lib/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function getAssetMap(assets: Asset[]) {
  return new Map(assets.map((asset) => [asset.id, asset]));
}

function getStoryMedia(payload: NonNullable<Awaited<ReturnType<typeof getPublishedStoryBySlug>>>) {
  const draft = payload.bundle.drafts.find((candidate) => candidate.id === payload.story.draftId);

  if (!draft) {
    return [] as Array<{ asset: Asset; moment: Moment }>;
  }

  const publishedMoments = new Map(
    payload.bundle.moments
      .filter((moment) => moment.status === "published")
      .map((moment) => [moment.id, moment])
  );
  const assetMap = getAssetMap(payload.bundle.assets);

  return draft.sourceMomentIds.reduce<Array<{ asset: Asset; moment: Moment }>>((current, momentId) => {
    const moment = publishedMoments.get(momentId);

    if (!moment?.assetId) {
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
  const payload = await getPublishedStoryBySlug(slug);

  if (!payload) {
    return { title: "Story not found" };
  }

  return {
    title: payload.story.title,
    description: payload.story.summary,
    openGraph: {
      title: payload.story.title,
      description: payload.story.summary,
      images: [
        getStoryMedia(payload).find(({ moment }) => moment.type === "photo")?.asset.url ??
          new URL("/app-icon.svg", appEnv.appUrl).toString()
      ]
    }
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { slug } = await params;
  const payload = await getPublishedStoryBySlug(slug);

  if (!payload) {
    notFound();
  }

  const storyComments = payload.bundle.comments.filter(
    (comment) => comment.storyId === payload.story.id
  );
  const storyMedia = getStoryMedia(payload);
  const coverImage = storyMedia.find(({ moment }) => moment.type === "photo")?.asset.url ?? null;
  const routeLocations = Array.from(
    new Set(payload.bundle.legs.flatMap((leg) => [leg.originLabel, leg.destinationLabel]).filter(Boolean))
  );
  const publishedDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
    new Date(payload.story.publishedAt)
  );

  return (
    <main className="shell">
      <AnimatedSection className="cover-hero">
        <section className="hero hero-cover article-hero">
          <div className="hero-copy">
            <p className="eyebrow">Feature story</p>
            <h1>{payload.story.title}</h1>
            <p>{payload.story.summary}</p>
            <div className="cover-meta-row">
              <DateBadge>{publishedDate}</DateBadge>
              {routeLocations[0] ? <LocationBadge>{routeLocations[0]}</LocationBadge> : null}
            </div>
            <div className="hero-actions">
              <Link className="ghost-button" href={`/t/${payload.trip.slug}`}>
                Retour au voyage
              </Link>
              <a className="primary-button" href="#story-comments">
                Lire les reactions
              </a>
            </div>
            <div className="hero-metrics">
              <span className="metric-chip">{storyMedia.length} media lie(s)</span>
              <span className="metric-chip">{storyComments.length} commentaire(s)</span>
            </div>
          </div>
          <aside className="hero-visual">
            <div
              className="cover-image"
              style={
                coverImage
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(16, 27, 43, 0.06), rgba(16, 27, 43, 0.32)), url(${coverImage})`
                    }
                  : undefined
              }
            >
              <div className="cover-image-note">
                <span className="note-accent">Published note</span>
                <strong>{payload.trip.title}</strong>
                <p>{formatDateLabel(payload.trip.startDate)} · {routeLocations.slice(0, 2).join(" · ")}</p>
              </div>
            </div>
          </aside>
        </section>
      </AnimatedSection>

      <AnimatedSection className="grid article-layout">
        <section className="article-prose">
          <div className="section-intro">
            <div>
              <p className="eyebrow">Recit</p>
              <h2>Chronique du jour</h2>
            </div>
          </div>
          <div className="story-body article-body">{payload.story.body}</div>
          <QuoteBlock
            cite={payload.trip.title}
            quote={payload.story.summary}
          />
        </section>

        <aside className="article-sidebar">
          <div className="sidebar-card">
            <span className="eyebrow">Details</span>
            <div className="sidebar-card-list">
              <div>
                <span className="sidebar-label">Publication</span>
                <strong>{publishedDate}</strong>
              </div>
              <div>
                <span className="sidebar-label">Lieu</span>
                <strong>{routeLocations.join(" · ") || payload.trip.title}</strong>
              </div>
              <div>
                <span className="sidebar-label">Commentaires</span>
                <strong>{storyComments.length}</strong>
              </div>
            </div>
          </div>
        </aside>
      </AnimatedSection>

      {storyMedia.length > 0 ? (
        <AnimatedSection className="panel">
          <div className="section-intro">
            <div>
              <p className="eyebrow">Mediatheque</p>
              <h2>Images, videos et traces de ce chapitre</h2>
            </div>
          </div>
          <PhotoGrid
            items={storyMedia.map(({ asset, moment }) => ({
              id: moment.id,
              type: moment.type,
              title: moment.caption || "Souvenir du post",
              body: moment.body,
              url: asset.url
            }))}
          />
        </AnimatedSection>
      ) : null}
      <AnimatedSection id="story-comments">
        <PublicCommentsPanel
          comments={storyComments}
          storyId={payload.story.id}
          tripId={payload.trip.id}
        />
      </AnimatedSection>
    </main>
  );
}
