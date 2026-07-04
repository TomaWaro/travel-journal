import { formatDateLabel } from "@/lib/date";
import type { DraftStory, Member, Moment, PublishedStory, TripDay } from "@/lib/types";

type Props = {
  days: TripDay[];
  moments: Moment[];
  members: Member[];
  drafts: DraftStory[];
  stories: PublishedStory[];
};

export function TimelinePanel({ days, moments, members, drafts, stories }: Props) {
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
                {dayMoments.map((moment) => (
                  <li key={moment.id}>
                    <strong>{moment.caption || moment.type}</strong>
                    <span>
                      {memberMap.get(moment.memberId)?.name ?? "Contributeur"} · {moment.status}
                    </span>
                  </li>
                ))}
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
