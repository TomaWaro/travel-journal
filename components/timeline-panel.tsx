"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TimelineItem } from "@/components/timeline-item";
import { formatDateLabel } from "@/lib/date";
import type { Asset, DraftStory, Member, Moment, PublishedStory, TripDay, PublicComment } from "@/lib/types";
import { PublicCommentsPanel } from "@/components/public-comments-panel";

type Props = {
  assets: Asset[];
  days: TripDay[];
  moments: Moment[];
  members: Member[];
  drafts: DraftStory[];
  stories: PublishedStory[];
  showEmptyDays?: boolean;
  comments?: PublicComment[];
  tripId?: string;
  role?: "owner" | "contributor" | "viewer";
  token?: string;
};

export function TimelinePanel({
  assets,
  days,
  moments,
  members,
  drafts,
  stories,
  showEmptyDays = true,
  comments,
  tripId,
  role,
  token
}: Props) {
  const router = useRouter();
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const memberMap = new Map(members.map((member) => [member.id, member]));
  const visibleDays = days.filter((day) => {
    if (showEmptyDays) {
      return true;
    }

    const hasMoment = moments.some((moment) => moment.dayDate === day.date);
    const hasDraft = drafts.some((draft) => draft.dayDate === day.date);
    const hasStory = stories.some((story) => story.slug.includes(day.date.replaceAll("-", "")));

    return hasMoment || hasDraft || hasStory;
  });

  const [allComments, setAllComments] = useState<PublicComment[]>(comments ?? []);

  useEffect(() => {
    if (comments) {
      setTimeout(() => {
        setAllComments(comments);
      }, 0);
    }
  }, [comments]);

  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    let id = localStorage.getItem("travel_journal_device_id");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("travel_journal_device_id", id);
    }
    setTimeout(() => {
      setDeviceId(id);
    }, 0);
  }, []);

  const handleEmojiReact = async (momentId: string, emoji: string) => {
    if (!deviceId) return;
    const reactionAuthor = `Reaction:${deviceId}`;

    const momentComments = allComments.filter((c) => c.momentId === momentId);
    const hasReacted = momentComments.some(
      (c) => c.body === emoji && c.authorName === reactionAuthor
    );

    try {
      if (hasReacted) {
        // Toggle off: Delete comment from database
        const response = await fetch(`/api/moments/${momentId}/comments`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            authorName: reactionAuthor,
            body: emoji,
            tripId
          })
        });
        if (response.ok) {
          setAllComments((current) =>
            current.filter(
              (c) =>
                !(
                  c.momentId === momentId &&
                  c.body === emoji &&
                  c.authorName === reactionAuthor
                )
            )
          );
        }
      } else {
        // Toggle on: Add reaction to database
        const response = await fetch(`/api/moments/${momentId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            authorName: reactionAuthor,
            body: emoji,
            tripId
          })
        });
        const payload = (await response.json()) as {
          comment?: PublicComment;
        };
        if (response.ok && payload.comment) {
          setAllComments((current) => [...current, payload.comment!]);
        }
      }
    } catch (e) {
      console.error("Failed to toggle emoji reaction:", e);
    }
  };

  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("collapsed_days="))
      ?.split("=")[1];
    
    if (cookieValue) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieValue));
        setTimeout(() => {
          setCollapsedDays(parsed);
          setIsInitialized(true);
        }, 0);
      } catch (e) {
        console.error("Failed to parse collapsed_days cookie", e);
        setTimeout(() => setIsInitialized(true), 0);
      }
    } else {
      setTimeout(() => setIsInitialized(true), 0);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    const expires = new Date();
    expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
    const cookieString = `collapsed_days=${encodeURIComponent(JSON.stringify(collapsedDays))}; expires=${expires.toUTCString()}; path=/`;
    document.cookie = cookieString;
  }, [collapsedDays, isInitialized]);

  const toggleDayCollapse = (date: string) => {
    setCollapsedDays((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  return (
    <section className="panel timeline-panel">
      <div className="timeline-header-container" style={{ textAlign: "center", marginBottom: "48px" }}>
        <h2 className="timeline-main-title">Timeline</h2>
      </div>
      <div className="timeline-list">
        {visibleDays.map((day) => {
          const dayMoments = moments.filter((moment) => moment.dayDate === day.date);
          const dayDrafts = drafts.filter((draft) => draft.dayDate === day.date);
          const dayStories = stories.filter((story) => story.slug.includes(day.date.replaceAll("-", "")));
          const primaryMoment = dayMoments[0];
          const primaryLocation =
            primaryMoment?.latitude !== null && primaryMoment?.longitude !== null ? "Moment géolocalisé" : undefined;
          const relatedStoryCount = dayStories.length;

          return (
            <TimelineItem
              date={formatDateLabel(day.date)}
              key={day.date}
              location={primaryLocation}
              note={
                relatedStoryCount > 0
                  ? `${dayMoments.length} moment(s) · ${relatedStoryCount} publication(s)`
                  : `${dayMoments.length} moment(s)`
              }
              title={primaryMoment?.caption || dayStories[0]?.title || "Une nouvelle journée de route"}
              isCollapsed={collapsedDays.includes(day.date)}
              onToggle={() => toggleDayCollapse(day.date)}
            >
              <ul className="compact-list timeline-moments">
                {dayMoments.length === 0 ? (
                  <li className="empty-state compact-empty">
                    <strong>Aucun moment capturé.</strong>
                    <p>La journée apparaîtra ici dès qu&apos;un souvenir sera publié.</p>
                  </li>
                ) : null}
                {dayMoments.map((moment) => {
                  const asset = moment.assetId ? assetMap.get(moment.assetId) : null;
                  const momentComments = allComments.filter((c) => c.momentId === moment.id);
                  const textComments = momentComments.filter((c) => !["❤️", "😂", "😮", "👏", "🔥", "67"].includes(c.body));

                  const emojis = ["❤️", "😂", "😮", "👏", "🔥", "67"];
                  const emojiCounts = emojis.reduce((acc, emo) => {
                    acc[emo] = momentComments.filter((c) => c.body === emo).length;
                    return acc;
                  }, {} as Record<string, number>);

                  return (
                    <li className={`moment-item ${asset ? "moment-has-asset" : "moment-text-only"}`} key={moment.id}>
                      {role === "owner" && token ? (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Voulez-vous vraiment supprimer ce souvenir définitivement ?")) return;
                            const response = await fetch(`/api/trips/${tripId}/moments`, {
                              method: "DELETE",
                              headers: {
                                "Content-Type": "application/json",
                                "x-access-token": token
                              },
                              body: JSON.stringify({ momentId: moment.id })
                            });
                            if (response.ok) {
                              router.refresh();
                            } else {
                              alert("Impossible de supprimer le souvenir.");
                            }
                          }}
                          className="timeline-delete-moment-btn"
                          title="Supprimer ce souvenir"
                        >
                          <span>🗑️</span>
                          <span>Supprimer</span>
                        </button>
                      ) : null}
                      <div className="moment-main-content">
                        {asset ? (
                          <div className="moment-media-wrapper">
                            {!moment.body ? (
                              <div className="washi-tape" />
                            ) : (
                              <div className="moment-description-tape-note">
                                <div className="washi-tape-scotch" />
                                <p>{moment.body}</p>
                              </div>
                            )}
                            <div className="moment-media">
                              {moment.type === "photo" ? (
                                <Image
                                  alt={moment.caption || "Moment photo"}
                                  height={960}
                                  loading="lazy"
                                  src={asset.url}
                                  width={1280}
                                />
                              ) : null}
                              {moment.type === "video" ? (
                                <video controls playsInline preload="metadata" src={asset.url} />
                              ) : null}
                              {moment.type === "audio" ? (
                                <audio controls preload="metadata" src={asset.url} />
                              ) : null}
                            </div>
                            
                            {/* Polaroid reaction counter stickers */}
                            <div className="polaroid-reactions-bar">
                              {emojis.map((emoji) => {
                                const count = emojiCounts[emoji] || 0;
                                const isReacted = deviceId
                                  ? momentComments.some(
                                      (c) =>
                                        c.body === emoji &&
                                        c.authorName === `Reaction:${deviceId}`
                                    )
                                  : false;
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleEmojiReact(moment.id, emoji)}
                                    className={`polaroid-emoji-btn${isReacted ? " active-reacted" : ""}`}
                                    style={emoji === "67" ? { display: "inline-flex", alignItems: "center", justifyContent: "center" } : undefined}
                                  >
                                    <span className="emoji-icon">
                                      {emoji === "67" ? (
                                         <Image
                                           src="/reaction_67.png"
                                           alt="67"
                                           height={32}
                                           width={48}
                                           style={{
                                             height: "32px",
                                             width: "auto",
                                             display: "block",
                                           }}
                                         />
                                      ) : (
                                        emoji
                                      )}
                                    </span>
                                    {count > 0 && <span className="emoji-count">{count}</span>}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="moment-caption-overlay">
                              <strong>{moment.caption || moment.type}</strong>
                              <span>
                                Par {memberMap.get(moment.memberId)?.name ?? "Contributeur"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="moment-text-card">
                            <strong>{moment.caption || moment.type}</strong>
                            <span>
                              Par {memberMap.get(moment.memberId)?.name ?? "Contributeur"}
                            </span>
                            {moment.body ? <p>{moment.body}</p> : null}
                          </div>
                        )}
                      </div>

                      {tripId ? (
                        <div className="moment-comments-wrapper">
                          <PublicCommentsPanel
                            comments={textComments}
                            compact
                            momentId={moment.id}
                            tripId={tripId}
                            title="Réactions"
                            intro="Écrivez un mot sur ce souvenir !"
                          />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {dayDrafts.length > 0 ? (
                <div className="tag-row">
                  {dayDrafts.map((draft) => (
                    <span className="tag" key={draft.id}>
                      Brouillon: {draft.title}
                    </span>
                  ))}
                </div>
              ) : null}
              {dayStories.length > 0 ? (
                <div className="tag-row">
                  {dayStories.map((story) => (
                    <span className="tag tag-published" key={story.id}>
                      Publié: {story.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </TimelineItem>
          );
        })}
        {visibleDays.length === 0 ? (
          <div className="empty-state">
            <strong>Aucune journée publiée pour le moment.</strong>
            <p>La timeline apparaîtra ici dès qu&apos;un souvenir ou un récit sera visible.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
