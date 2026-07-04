import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { appEnv } from "@/lib/env";
import { getPublishedStoryBySlug } from "@/lib/store";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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
      images: [new URL("/app-icon.svg", appEnv.appUrl).toString()]
    }
  };
}

export default async function StoryPage({ params }: PageProps) {
  const { slug } = await params;
  const payload = await getPublishedStoryBySlug(slug);

  if (!payload) {
    notFound();
  }

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
        </div>
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <p className="eyebrow">Recit</p>
        <div className="story-body">{payload.story.body}</div>
      </section>
    </main>
  );
}
