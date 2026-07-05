import Image from "next/image";
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
  tripId
}: Props) {
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

  return (
    <section className="panel timeline-panel">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Le trajet jour après jour</h2>
        </div>
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
                  const momentComments = (comments ?? []).filter((c) => c.momentId === moment.id);

                  return (
                    <li className={`moment-item ${asset ? "moment-has-asset" : "moment-text-only"}`} key={moment.id}>
                      <div className="moment-main-content">
                        {asset ? (
                          <div className="moment-media-wrapper">
                            <div className="washi-tape" />
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
                        {asset && moment.body ? (
                          <div className="moment-body-below">
                            <p>{moment.body}</p>
                          </div>
                        ) : null}
                      </div>

                      {tripId ? (
                        <div className="moment-comments-wrapper">
                          <PublicCommentsPanel
                            comments={momentComments}
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
