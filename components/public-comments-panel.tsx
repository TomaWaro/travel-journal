"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { PublicComment } from "@/lib/types";

type Props = {
  comments: PublicComment[];
  compact?: boolean;
  intro?: string;
  momentId?: string;
  storyId?: string;
  title?: string;
  tripId: string;
};

function formatCommentDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function PublicCommentsPanel({
  comments,
  compact = false,
  intro = "Un nom, un message, et c'est publié tout de suite. Aucun compte nécessaire.",
  momentId,
  storyId,
  title = "Laisser un mot",
  tripId
}: Props) {
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
      const endpoint = momentId
        ? `/api/moments/${momentId}/comments`
        : storyId
          ? `/api/published-stories/${storyId}/comments`
          : `/api/trips/${tripId}/comments`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          authorName,
          body,
          tripId
        })
      });
      const payload = (await response.json()) as {
        comment?: PublicComment;
        error?: string;
      };

      if (!response.ok || !payload.comment) {
        setMessage(payload.error ?? "Impossible d'envoyer le commentaire.");
        return;
      }

      setItems((current) => [...current, payload.comment!]);
      setAuthorName("");
      setBody("");
      setMessage("Commentaire ajouté !");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmojiClick(emoji: string) {
    if (submitting) return;
    setSubmitting(true);
    setMessage("");

    const name = authorName.trim() || "Visiteur";

    try {
      const endpoint = momentId
        ? `/api/moments/${momentId}/comments`
        : storyId
          ? `/api/published-stories/${storyId}/comments`
          : `/api/trips/${tripId}/comments`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          authorName: name,
          body: emoji,
          tripId
        })
      });
      const payload = (await response.json()) as {
        comment?: PublicComment;
        error?: string;
      };

      if (!response.ok || !payload.comment) {
        setMessage(payload.error ?? "Impossible d'envoyer la réaction.");
        return;
      }

      setItems((current) => [...current, payload.comment!]);
      setMessage("Réaction envoyée !");
      setTimeout(() => setMessage(""), 2000);
    } catch (e) {
      console.error("Emoji reaction failed:", e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={`panel comments-panel${compact ? " comments-panel-compact" : ""}`}>
      {compact ? (
        <div className="compact-comments-head">
          <h4>{title}</h4>
          <span className="comment-counter">{items.length}</span>
        </div>
      ) : (
        <div className="section-intro">
          <div>
            <p className="eyebrow">Commentaires</p>
            <h2>{title} 🍷🍇</h2>
            <p className="comment-intro">{intro}</p>
          </div>
          <span className="comment-counter">{items.length} message(s)</span>
        </div>
      )}

      {!compact && (
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
      )}

      {message && !compact ? <p className="status-line">{message}</p> : null}

      <div className="comment-list">
        {items.length === 0 ? (
          <div className="comment-card empty-comments-card">
            <p>Pas encore de mot doux. Soyez le premier ! 💬</p>
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

      {compact && (
        <form className="compact-form" onSubmit={handleSubmit}>
          <div className="compact-form-row">
            <input
              className="compact-input-name"
              maxLength={50}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Nom"
              required
              type="text"
              value={authorName}
            />
            <input
              className="compact-input-body"
              maxLength={1200}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Ajouter un commentaire..."
              required
              type="text"
              value={body}
            />
            <button className="compact-send-button" disabled={submitting} type="submit" aria-label="Envoyer">
              {submitting ? "..." : "🚀"}
            </button>
          </div>
          {message ? <p className="compact-status-line">{message}</p> : null}
        </form>
      )}
    </section>
  );
}
