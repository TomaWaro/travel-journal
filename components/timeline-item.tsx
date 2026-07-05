import type { ReactNode } from "react";
import { DateBadge, LocationBadge } from "@/components/editorial-badges";

type Props = {
  date: string;
  title: string;
  location?: string;
  note?: string;
  children?: ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
};

export function TimelineItem({
  date,
  title,
  location,
  note,
  children,
  isCollapsed = false,
  onToggle
}: Props) {
  return (
    <article className={`timeline-item ${isCollapsed ? "timeline-item-collapsed" : ""}`}>
      <div className="timeline-marker" aria-hidden="true" />
      <div className="timeline-content">
        <div 
          className="timeline-header-clickable" 
          onClick={onToggle}
          style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "6px" }}
        >
          <div className="timeline-kicker" style={{ display: "flex", alignItems: "center", width: "100%" }}>
            <DateBadge>{date}</DateBadge>
            {location ? <LocationBadge>{location}</LocationBadge> : null}
            <span className="collapse-toggle-icon" style={{ marginLeft: "auto", fontSize: "1rem" }}>
              {isCollapsed ? "➕" : "➖"}
            </span>
          </div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {note && !isCollapsed ? <p className="timeline-note" style={{ margin: "4px 0 0 0" }}>{note}</p> : null}
        </div>
        {!isCollapsed && <div style={{ marginTop: "16px" }}>{children}</div>}
      </div>
    </article>
  );
}
