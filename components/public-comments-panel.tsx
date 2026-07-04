"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { PublicComment } from "@/lib/types";

type Props = {
  comments: PublicComment[];
  storyId?: string;
  tripId: string;
};

function formatCommentDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function PublicCommentsPanel({ comments, storyId, tripId }: Props) {
  const [items, setItems] = useState(comments);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        storyId ? `/api/published-stories/${storyId}/comments` : `/api/trips/${tripId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            authorName,
            body,
            tripId
          })
        }
      );
      const payload = (await response.json()) as {
        comment?: PublicComment;
        error?: string;
      };

      if (!response.ok || !payload.comment) {
        setMessage(payload.error ?? "Impossible d'envoyer le commentaire.");
        return;
      }

      setItems((current) => [payload.comment!, ...current]);
      setAuthorName("");
      setBody("");
      setMessage("Commentaire ajoute.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel comments-panel">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Commentaires</p>
          <h2>Reagir sans compte</h2>
          <p className="comment-intro">
            Un nom, un message, et c&apos;est publie tout de suite. Aucun compte necessaire.
          </p>
        </div>
        <span className="comment-counter">{items.length} message(s)</span>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Votre nom</span>
          <input
            maxLength={50}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="Ex: Claire"
            required
            type="text"
            value={authorName}
          />
        </label>
        <label className="field">
          <span>Votre commentaire</span>
          <textarea
            maxLength={1200}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Un message rapide, une reaction, un souvenir..."
            required
            rows={4}
            value={body}
          />
        </label>
        <div className="button-row">
          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? "Envoi..." : "Publier le commentaire"}
          </button>
        </div>
      </form>

      {message ? <p className="status-line">{message}</p> : null}

      <div className="comment-list">
        {items.length === 0 ? (
          <div className="comment-card">
            <strong>Pas encore de commentaire.</strong>
            <p>Soyez le premier a reagir.</p>
          </div>
        ) : null}
        {items.map((comment) => (
          <article className="comment-card" key={comment.id}>
            <div className="comment-head">
              <strong>{comment.authorName}</strong>
              <span>{formatCommentDate(comment.createdAt)}</span>
            </div>
            <p>{comment.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
