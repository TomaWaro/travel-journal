import Image from "next/image";
import { TimelineItem } from "@/components/timeline-item";
import { formatDateLabel } from "@/lib/date";
import type { Asset, DraftStory, Member, Moment, PublishedStory, TripDay } from "@/lib/types";

type Props = {
  assets: Asset[];
  days: TripDay[];
  moments: Moment[];
  members: Member[];
  drafts: DraftStory[];
  stories: PublishedStory[];
};

export function TimelinePanel({ assets, days, moments, members, drafts, stories }: Props) {
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const memberMap = new Map(members.map((member) => [member.id, member]));

  return (
    <section className="panel timeline-panel">
      <div className="section-intro">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Le trajet jour apres jour</h2>
        </div>
      </div>
      <div className="timeline-list">
        {days.map((day) => {
          const dayMoments = moments.filter((moment) => moment.dayDate === day.date);
          const dayDrafts = drafts.filter((draft) => draft.dayDate === day.date);
          const dayStories = stories.filter((story) => story.slug.includes(day.date.replaceAll("-", "")));
          const primaryMoment = dayMoments[0];
          const primaryLocation =
            primaryMoment?.latitude !== null && primaryMoment?.longitude !== null ? "Moment geolocalise" : undefined;

          return (
            <TimelineItem
              date={formatDateLabel(day.date)}
              key={day.date}
              location={primaryLocation}
              note={`${dayMoments.length} moment(s) · ${dayStories.length} recit(s)`}
              title={primaryMoment?.caption || dayStories[0]?.title || "Une nouvelle journee de route"}
            >
              <ul className="compact-list timeline-moments">
                {dayMoments.length === 0 ? (
                  <li className="empty-state compact-empty">
                    <strong>Aucun moment capture.</strong>
                    <p>La journee apparaîtra ici des qu&apos;un souvenir sera publie.</p>
                  </li>
                ) : null}
                {dayMoments.map((moment) => {
                  const asset = moment.assetId ? assetMap.get(moment.assetId) : null;

                  return (
                    <li className="moment-item" key={moment.id}>
                      <div className="moment-copy">
                        <strong>{moment.caption || moment.type}</strong>
                        <span>
                          {memberMap.get(moment.memberId)?.name ?? "Contributeur"} · {moment.status}
                        </span>
                        {moment.body ? <p>{moment.body}</p> : null}
                      </div>
                      {asset ? (
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
                      Publie: {story.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </TimelineItem>
          );
        })}
      </div>
    </section>
  );
}
