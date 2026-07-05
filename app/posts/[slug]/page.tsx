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
  const momentCommentMap = new Map(
    payload.bundle.comments
      .filter((comment) => comment.momentId)
      .map((comment) => [comment.momentId!, [] as typeof payload.bundle.comments])
  );
  const storyMedia = getStoryMedia(payload);
  const coverImage = storyMedia.find(({ moment }) => moment.type === "photo")?.asset.url ?? null;
  const routeLocations = Array.from(
    new Set(payload.bundle.legs.flatMap((leg) => [leg.originLabel, leg.destinationLabel]).filter(Boolean))
  );
  const publishedDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
    new Date(payload.story.publishedAt)
  );

  for (const comment of payload.bundle.comments) {
    if (comment.momentId) {
      momentCommentMap.set(comment.momentId, [...(momentCommentMap.get(comment.momentId) ?? []), comment]);
    }
  }

  return (
    <main className="shell">
      <AnimatedSection className="landing-stage" delay={60}>
        <section className="hero hero-cover article-hero hero-launch">
          <div className="hero-noise" aria-hidden="true" />
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
            <div className="scroll-cue">
              <span className="scroll-cue-line" aria-hidden="true" />
              <span>Lire le chapitre</span>
            </div>
          </div>
          <aside className="hero-visual">
            <div
              className="cover-image cover-image-immersive"
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
            <div className="floating-cards">
              <div className="floating-card floating-card-secondary">
                <span className="eyebrow">Reader view</span>
                <p>Grandes images, citations, details et reactions sans friction.</p>
              </div>
            </div>
          </aside>
          <div className="marquee-shell" aria-hidden="true">
            <div className="marquee-track">
              {(routeLocations.length > 0 ? routeLocations : ["Travel", "Diary", "Edition"]).map((location) => (
                <span key={location}>{location}</span>
              ))}
              {(routeLocations.length > 0 ? routeLocations : ["Travel", "Diary", "Edition"]).map((location) => (
                <span key={`${location}-dup`}>{location}</span>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection className="article-stage" delay={140}>
        <section className="article-stage-grid">
        <section className="article-prose">
          <div className="section-intro">
            <div>
              <p className="eyebrow">Recit</p>
              <h2>Chronique du jour</h2>
            </div>
          </div>
          <div className="story-body article-body">{payload.story.body}</div>
          <QuoteBlock cite={payload.trip.title} quote={payload.story.summary} />
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
          <div className="sidebar-card sidebar-card-note">
            <span className="note-accent">Editor&apos;s note</span>
            <p>
              Ce chapitre s&apos;inscrit dans {payload.trip.title}. Les commentaires restent ouverts
              pour garder le journal vivant.
            </p>
          </div>
        </aside>
        </section>
      </AnimatedSection>

      {storyMedia.length > 0 ? (
        <AnimatedSection className="panel panel-cinematic" delay={180}>
          <div className="section-intro">
            <div>
              <p className="eyebrow">Mediatheque</p>
              <h2>Images, videos et traces de ce chapitre</h2>
            </div>
          </div>
          <PhotoGrid
            items={storyMedia.map(({ asset, moment }) => ({
              comments: momentCommentMap.get(moment.id) ?? [],
              id: moment.id,
              type: moment.type,
              title: moment.caption || "Souvenir du post",
              body: moment.body,
              tripId: payload.trip.id,
              url: asset.url
            }))}
          />
        </AnimatedSection>
      ) : null}
      <AnimatedSection id="story-comments" delay={220}>
        <PublicCommentsPanel
          comments={storyComments}
          storyId={payload.story.id}
          tripId={payload.trip.id}
        />
      </AnimatedSection>
    </main>
  );
}
