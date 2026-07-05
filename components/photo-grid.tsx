"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { PublicCommentsPanel } from "@/components/public-comments-panel";
import type { PublicComment } from "@/lib/types";

type GridItem = {
  body?: string;
  comments: PublicComment[];
  id: string;
  title: string;
  tripId: string;
  type: "photo" | "video" | "audio" | "text";
  url: string;
};

type Props = {
  items: GridItem[];
};

export function PhotoGrid({ items }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIndex = useMemo(
    () => (activeId ? items.findIndex((item) => item.id === activeId) : -1),
    [activeId, items]
  );
  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  useEffect(() => {
    if (!activeItem) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveId(null);
      }

      if (event.key === "ArrowRight" && items.length > 1) {
        setActiveId(items[(activeIndex + 1) % items.length]?.id ?? null);
      }

      if (event.key === "ArrowLeft" && items.length > 1) {
        setActiveId(items[(activeIndex - 1 + items.length) % items.length]?.id ?? null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, activeItem, items]);

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <strong>La galerie s&apos;ouvrira avec les premiers souvenirs.</strong>
        <p>Photos, videos et notes publiees apparaitront ici au fil du voyage.</p>
      </div>
    );
  }

  return (
    <>
      <div className="photo-marquee">
        <div className="photo-marquee-track">
          {[...items, ...items].map((item, index) => (
            <figure className="photo-strip-card" key={`${item.id}-${index}`}>
            <button
              aria-label={`Ouvrir ${item.title}`}
              className="photo-grid-trigger"
              onClick={() => setActiveId(item.id)}
              type="button"
            >
              {item.type === "photo" ? (
                <Image alt={item.title} fill sizes="(max-width: 879px) 100vw, 50vw" src={item.url} />
              ) : item.type === "video" ? (
                <video playsInline preload="metadata" src={item.url} />
              ) : item.type === "audio" ? (
                <div className="photo-grid-text-fallback">
                  <span className="note-accent">Audio</span>
                  <p>{item.title}</p>
                </div>
              ) : (
                <div className="photo-grid-text-fallback">
                  <span className="note-accent">{item.title}</span>
                  {item.body ? <p>{item.body}</p> : null}
                </div>
              )}
              <span className="photo-grid-open">Voir</span>
            </button>
            <figcaption>
              <span className="photo-grid-caption">{item.title}</span>
              {item.body ? <p>{item.body}</p> : null}
            </figcaption>
          </figure>
          ))}
        </div>
      </div>

      {activeItem ? (
        <div
          aria-modal="true"
          className="photo-viewer"
          onClick={() => setActiveId(null)}
          role="dialog"
        >
          <div className="photo-viewer-shell" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Fermer la visionneuse"
              className="ghost-button photo-viewer-close"
              onClick={() => setActiveId(null)}
              type="button"
            >
              Fermer
            </button>

            <div className="photo-viewer-stage">
              {activeItem.type === "photo" ? (
                <div className="photo-viewer-media photo-viewer-media-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={activeItem.title} className="photo-viewer-image" src={activeItem.url} />
                </div>
              ) : activeItem.type === "video" ? (
                <div className="photo-viewer-media">
                  <video controls playsInline src={activeItem.url} />
                </div>
              ) : activeItem.type === "audio" ? (
                <div className="photo-viewer-media photo-viewer-media-fallback">
                  <strong>{activeItem.title}</strong>
                  <audio controls preload="metadata" src={activeItem.url} />
                </div>
              ) : (
                <div className="photo-viewer-media photo-viewer-media-fallback">
                  <strong>{activeItem.title}</strong>
                  {activeItem.body ? <p>{activeItem.body}</p> : null}
                </div>
              )}
            </div>

            <aside className="photo-viewer-aside">
              <div className="photo-viewer-copy">
                <p className="eyebrow">Souvenir</p>
                <h3>{activeItem.title}</h3>
                {activeItem.body ? <p>{activeItem.body}</p> : null}
                <span className="photo-viewer-count">
                  {activeIndex + 1} / {items.length}
                </span>
              </div>

              <div className="photo-viewer-actions">
                <button
                  className="ghost-button"
                  disabled={items.length < 2}
                  onClick={() =>
                    setActiveId(items[(activeIndex - 1 + items.length) % items.length]?.id ?? null)
                  }
                  type="button"
                >
                  Precedente
                </button>
                <button
                  className="ghost-button"
                  disabled={items.length < 2}
                  onClick={() => setActiveId(items[(activeIndex + 1) % items.length]?.id ?? null)}
                  type="button"
                >
                  Suivante
                </button>
              </div>

              <PublicCommentsPanel
                comments={activeItem.comments}
                compact
                intro="Un mot rapide, une reaction, un detail drole. Le commentaire est lie a cette image."
                momentId={activeItem.id}
                title="Reagir a cette photo"
                tripId={activeItem.tripId}
              />
            </aside>
          </div>
        </div>
      ) : null}
    </>
  );
}
