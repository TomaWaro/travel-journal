import type { ReactNode } from "react";
import { DateBadge, LocationBadge } from "@/components/editorial-badges";

type Props = {
  date: string;
  title: string;
  location?: string;
  note?: string;
  children?: ReactNode;
};

export function TimelineItem({ date, title, location, note, children }: Props) {
  return (
    <article className="timeline-item">
      <div className="timeline-marker" aria-hidden="true" />
      <div className="timeline-content">
        <div className="timeline-kicker">
          <DateBadge>{date}</DateBadge>
          {location ? <LocationBadge>{location}</LocationBadge> : null}
        </div>
        <h3>{title}</h3>
        {note ? <p className="timeline-note">{note}</p> : null}
        {children}
      </div>
    </article>
  );
}
