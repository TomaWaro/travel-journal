import { formatDateLabel } from "@/lib/date";
import type { DraftStory, Moment, RouteLeg, TrackSession, Trip } from "@/lib/types";

function pickHighlights(moments: Moment[]): string[] {
  return moments
    .slice(0, 5)
    .map((moment) => moment.caption || moment.body)
    .filter(Boolean);
}

export function buildDraftStory({
  trip,
  dayDate,
  moments,
  legs,
  sessions
}: {
  trip: Trip;
  dayDate: string | null;
  moments: Moment[];
  legs: RouteLeg[];
  sessions: TrackSession[];
}): Omit<DraftStory, "id" | "createdAt"> {
  const highlights = pickHighlights(moments);
  const legSummary = legs.map((leg) => leg.title).join(" · ");
  const sessionSummary =
    sessions.length > 0
      ? `${sessions.length} session${sessions.length > 1 ? "s" : ""} de trajet enregistrée${sessions.length > 1 ? "s" : ""}`
      : "aucune session de trajet enregistrée";
  const title = dayDate
    ? `${trip.title} · ${formatDateLabel(dayDate)}`
    : `${trip.title} · recap voyage`;
  const summary = highlights[0]
    ? `${highlights[0]} (${sessionSummary})`
    : `Recap du voyage avec ${sessionSummary}.`;
  const bodySections = [
    `Itineraire: ${legSummary || "pas de leg planifie pour cette fenetre."}`,
    highlights.length > 0
      ? `Moments forts:\n${highlights.map((highlight) => `- ${highlight}`).join("\n")}`
      : "Moments forts:\n- Rien n'a encore ete ajoute pour cette journee.",
    `Trace: ${sessionSummary}.`,
    "Publication: ce brouillon reste prive jusqu'a validation manuelle."
  ];

  return {
    tripId: trip.id,
    dayDate,
    title,
    summary,
    body: bodySections.join("\n\n"),
    sourceMomentIds: moments.map((moment) => moment.id),
    sourceTrackSessionIds: sessions.map((session) => session.id)
  };
}
