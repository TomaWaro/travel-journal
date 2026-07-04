import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicCommentsPanel } from "@/components/public-comments-panel";
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

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Post public</p>
          <h1>{payload.story.title}</h1>
          <p>{payload.story.summary}</p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-button" href={`/t/${payload.trip.slug}`}>
            Retour au voyage
          </Link>
          <a className="ghost-button" href="#story-comments">
            Lire les reactions
          </a>
        </div>
        <div className="hero-metrics">
          <span className="metric-chip">{storyMedia.length} media lie(s)</span>
          <span className="metric-chip">{storyComments.length} commentaire(s)</span>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <p className="eyebrow">Recit</p>
        <div className="story-body">{payload.story.body}</div>
      </section>
      {storyMedia.length > 0 ? (
        <section className="panel" style={{ marginTop: 24 }}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Mediatheque</p>
              <h2>Images et souvenirs lies a ce post</h2>
            </div>
          </div>
          <div className="media-gallery">
            {storyMedia.map(({ asset, moment }) => (
              <article className="gallery-card" key={moment.id}>
                {moment.type === "photo" ? (
                  <Image
                    alt={moment.caption || "Photo du post"}
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
      <section id="story-comments" style={{ marginTop: 24 }}>
        <PublicCommentsPanel
          comments={storyComments}
          storyId={payload.story.id}
          tripId={payload.trip.id}
        />
      </section>
    </main>
  );
}
