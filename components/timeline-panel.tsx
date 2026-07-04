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
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2>Jours, moments et brouillons</h2>
        </div>
      </div>
      <div className="timeline-grid">
        {days.map((day) => {
          const dayMoments = moments.filter((moment) => moment.dayDate === day.date);
          const dayDrafts = drafts.filter((draft) => draft.dayDate === day.date);
          const dayStories = stories.filter((story) => story.slug.includes(day.date.replaceAll("-", "")));

          return (
            <article className="day-card" key={day.date}>
              <div className="day-card-head">
                <h3>{formatDateLabel(day.date)}</h3>
                <span>{dayMoments.length} moment(s)</span>
              </div>
              <ul className="compact-list">
                {dayMoments.length === 0 ? <li>Aucun moment capture pour le moment.</li> : null}
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
                            <img alt={moment.caption || "Moment photo"} loading="lazy" src={asset.url} />
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
