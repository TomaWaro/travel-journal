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
    <article className={`timeline-item ${isCollapsed ? "timeline-item-collapsed" : ""}`} style={{ marginBottom: "28px" }}>
      <div className="timeline-marker" aria-hidden="true" />
      <div 
        className="timeline-content" 
        style={{ 
          padding: 0, 
          overflow: "hidden", 
          borderRadius: "24px", 
          border: "1px solid rgba(20, 32, 50, 0.08)", 
          background: "rgba(255, 255, 255, 0.65)",
          boxShadow: "var(--shadow-soft)"
        }}
      >
        {/* Bandeau d'en-tête visible */}
        <div 
          className="timeline-header-bandeau" 
          onClick={onToggle}
          style={{
            cursor: "pointer",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            background: isCollapsed 
              ? "linear-gradient(135deg, #f3e5d0, #e9d9c2)" 
              : "linear-gradient(135deg, #fbf3e6, #f3e5d0)",
            borderBottom: isCollapsed ? "0px" : "1px solid rgba(20, 32, 50, 0.08)",
            transition: "all 0.3s ease",
            userSelect: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <div className="timeline-pinned-date">
              <span className="push-pin">📌</span>
              <span className="date-text">{date}</span>
            </div>
          </div>
          
          <div 
            className="collapse-arrow-container"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(20, 32, 50, 0.04)",
              transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)"
            }}
          >
            <span style={{ fontSize: "1.1rem", color: "var(--ink-soft)" }}>▼</span>
          </div>
        </div>

        {/* Corps de la journée avec animation fluide */}
        <div 
          className="timeline-item-body-wrapper"
          style={{
            maxHeight: isCollapsed ? "0px" : "9999px",
            opacity: isCollapsed ? 0 : 1,
            overflow: "hidden",
            transition: isCollapsed
              ? "max-height 0.4s cubic-bezier(0.3, 0.5, 0.3, 1), opacity 0.3s ease, padding 0.3s ease"
              : "max-height 0.8s cubic-bezier(0.15, 0.85, 0.3, 1), opacity 0.5s ease, padding 0.5s ease",
            padding: isCollapsed ? "0px" : undefined
          }}
        >
          {children}
        </div>
      </div>
    </article>
  );
}
