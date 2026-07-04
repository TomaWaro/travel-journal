"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DraftStory, PublishedStory, Trip, TripDay } from "@/lib/types";

type Props = {
  token: string;
  trip: Trip;
  days: TripDay[];
  drafts: DraftStory[];
  stories: PublishedStory[];
};

export function EditorialPanel({ token, trip, days, drafts, stories }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string>("");

  async function generate(dayDate: string | null) {
    const response = await fetch(`/api/trips/${trip.id}/drafts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token
      },
      body: JSON.stringify({ dayDate })
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? "Impossible de generer un brouillon.");
      return;
    }

    setMessage(dayDate ? "Brouillon journalier genere." : "Brouillon global genere.");
    router.refresh();
  }

  async function publish(draftId: string) {
    const response = await fetch(`/api/drafts/${draftId}/publish`, {
      method: "POST",
      headers: {
        "x-access-token": token
      }
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? "Impossible de publier.");
      return;
    }

    setMessage("Brouillon publie.");
    router.refresh();
  }

  async function unpublish(storyId: string) {
    const response = await fetch(`/api/published-stories/${storyId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token
      },
      body: JSON.stringify({ action: "unpublish" })
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? "Impossible de retirer la publication.");
      return;
    }

    setMessage("Publication retiree.");
    router.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Editorial</p>
          <h2>Generer, relire, publier</h2>
        </div>
      </div>

      <div className="editorial-grid">
        <div className="stack">
          <h3>Generation manuelle</h3>
          <button className="primary-button" onClick={() => generate(null)} type="button">
            Generer un recap voyage
          </button>
          <div className="tag-row">
            {days.map((day) => (
              <button className="mini-button" key={day.date} onClick={() => generate(day.date)} type="button">
                {day.date}
              </button>
            ))}
          </div>
        </div>

        <div className="stack">
          <h3>Brouillons</h3>
          <ul className="compact-list">
            {drafts.length === 0 ? <li>Aucun brouillon pour l&apos;instant.</li> : null}
            {drafts.map((draft) => (
              <li key={draft.id}>
                <div>
                  <strong>{draft.title}</strong>
                  <span>{draft.summary}</span>
                </div>
                <button className="mini-button" onClick={() => publish(draft.id)} type="button">
                  Publier
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="stack">
          <h3>Publie</h3>
          <ul className="compact-list">
            {stories.length === 0 ? <li>Aucun post public pour l&apos;instant.</li> : null}
            {stories.map((story) => (
              <li key={story.id}>
                <div>
                  <strong>{story.title}</strong>
                  <span>/posts/{story.slug}</span>
                </div>
                <button className="mini-button" onClick={() => unpublish(story.id)} type="button">
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {message ? <p className="status-line">{message}</p> : null}
    </section>
  );
}
