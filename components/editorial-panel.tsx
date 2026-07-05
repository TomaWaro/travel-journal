"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateLabel } from "@/lib/date";
import type { DraftStory, Moment, PublishedStory, Trip, TripDay } from "@/lib/types";

type Props = {
  token: string;
  trip: Trip;
  days: TripDay[];
  drafts: DraftStory[];
  moments: Moment[];
  stories: PublishedStory[];
};

export function EditorialPanel({ token, trip, days, drafts, moments, stories }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const publishedDraftIds = new Set(stories.map((story) => story.draftId));
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const daysWithContent = days.filter((day) =>
    moments.some((moment) => moment.dayDate === day.date) ||
    drafts.some((draft) => draft.dayDate === day.date) ||
    stories.some((story) => story.slug.includes(day.date.replaceAll("-", "")))
  );

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

  async function saveDraft(draftId: string, formData: FormData) {
    setSavingDraftId(draftId);
    setMessage("");

    try {
      const response = await fetch(`/api/drafts/${draftId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token
        },
        body: JSON.stringify({
          title: formData.get("title"),
          summary: formData.get("summary"),
          body: formData.get("body")
        })
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "Impossible d'enregistrer le brouillon.");
        return;
      }

      setMessage("Brouillon mis a jour.");
      router.refresh();
    } finally {
      setSavingDraftId(null);
    }
  }

  async function removeDraft(draftId: string) {
    const response = await fetch(`/api/drafts/${draftId}`, {
      method: "DELETE",
      headers: {
        "x-access-token": token
      }
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error ?? "Impossible de supprimer le brouillon.");
      return;
    }

    setMessage("Brouillon supprime.");
    router.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-heading workspace-panel-heading">
        <div>
          <p className="eyebrow">Editorial</p>
          <h2>Relire et publier les recits</h2>
          <p>
            Le principe est simple : tu generes un brouillon, tu modifies le titre, le resume et
            le recit si besoin, puis tu publies. Tant qu&apos;un brouillon n&apos;est pas publie,
            il n&apos;apparait pas sur la page publique.
          </p>
        </div>
      </div>

      <div className="editorial-stack">
        <section className="editorial-block">
          <div className="editorial-block-head">
            <div>
              <p className="eyebrow">Etape 1</p>
              <h3>Generer un brouillon</h3>
              <p>Cree un recap global ou un recap pour une journee qui contient deja des moments.</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => generate(null)} type="button">
            Generer un recap voyage
          </button>
          <div className="editorial-day-grid">
            {daysWithContent.length === 0 ? (
              <div className="empty-state">
                <strong>Aucune journee exploitable pour l&apos;instant.</strong>
                <p>Ajoute d&apos;abord des moments dans `Capture`.</p>
              </div>
            ) : null}
            {daysWithContent.map((day) => {
              const momentCount = moments.filter((moment) => moment.dayDate === day.date).length;

              return (
                <button
                  className="editorial-day-button"
                  key={day.date}
                  onClick={() => generate(day.date)}
                  type="button"
                >
                  <strong>{formatDateLabel(day.date)}</strong>
                  <span>{momentCount} moment(s)</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="editorial-block">
          <div className="editorial-block-head">
            <div>
              <p className="eyebrow">Etape 2</p>
              <h3>Modifier le brouillon</h3>
              <p>
                Ici tu peux corriger le texte genere avant de le rendre public. C&apos;est
                l&apos;ecran d&apos;edition du recit.
              </p>
            </div>
          </div>
          <div className="editorial-card-list">
            {drafts.length === 0 ? (
              <div className="empty-state">
                <strong>Aucun brouillon en attente.</strong>
                <p>Genere d&apos;abord un recap pour relire avant publication.</p>
              </div>
            ) : null}
            {drafts.map((draft) => (
              <form
                className="editorial-card editorial-draft-form"
                key={draft.id}
                onSubmit={async (event) => {
                  event.preventDefault();
                  await saveDraft(draft.id, new FormData(event.currentTarget));
                }}
              >
                <div className="editorial-card-copy">
                  <p>{draft.dayDate ? formatDateLabel(draft.dayDate) : "Recap global du voyage"}</p>
                  <strong>
                    {publishedDraftIds.has(draft.id)
                      ? "Deja publie, modifiable et republicable."
                      : "Brouillon prive non publie."}
                  </strong>
                </div>
                <label className="field">
                  <span>Titre</span>
                  <input defaultValue={draft.title} name="title" required type="text" />
                </label>
                <label className="field">
                  <span>Resume</span>
                  <textarea defaultValue={draft.summary} name="summary" required rows={3} />
                </label>
                <label className="field">
                  <span>Recit</span>
                  <textarea defaultValue={draft.body} name="body" required rows={10} />
                </label>
                <div className="button-row">
                  <button className="mini-button" onClick={() => removeDraft(draft.id)} type="button">
                    Supprimer
                  </button>
                  <button className="ghost-button" disabled={savingDraftId === draft.id} type="submit">
                    {savingDraftId === draft.id ? "Enregistrement..." : "Enregistrer le brouillon"}
                  </button>
                  <button className="primary-button" onClick={() => publish(draft.id)} type="button">
                    {publishedDraftIds.has(draft.id) ? "Republier" : "Publier"}
                  </button>
                </div>
              </form>
            ))}
          </div>
        </section>

        <section className="editorial-block">
          <div className="editorial-block-head">
            <div>
              <p className="eyebrow">Etape 3</p>
              <h3>Posts deja publies</h3>
              <p>Ceux-ci sont deja visibles sur le site public. Tu peux les retirer si besoin.</p>
              <p>Pour modifier un post deja en ligne, edite son brouillon ci-dessus puis clique sur `Republier`.</p>
            </div>
          </div>
          <div className="editorial-card-list">
            {stories.length === 0 ? (
              <div className="empty-state">
                <strong>Aucun post public.</strong>
                <p>Publie un brouillon pour voir apparaitre un recit sur la page publique.</p>
              </div>
            ) : null}
            {stories.map((story) => (
              <article className="editorial-card" key={story.id}>
                <div className="editorial-card-copy">
                  <strong>{story.title}</strong>
                  <span>/posts/{story.slug}</span>
                  <p>{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(story.publishedAt))}</p>
                </div>
                <button className="mini-button" onClick={() => unpublish(story.id)} type="button">
                  Retirer
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      {message ? <p className="status-line">{message}</p> : null}
    </section>
  );
}
