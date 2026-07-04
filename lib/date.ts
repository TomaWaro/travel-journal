import type { Trip, TripDay } from "@/lib/types";

export function buildTripDays(trip: Trip): TripDay[] {
  const start = new Date(`${trip.startDate}T12:00:00.000Z`);
  const end = new Date(`${trip.endDate}T12:00:00.000Z`);
  const days: TripDay[] = [];

  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const isoDate = cursor.toISOString().slice(0, 10);
    days.push({
      date: isoDate,
      label: formatDateLabel(isoDate)
    });
  }

  return days;
}

export function formatDateLabel(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date(`${isoDate}T12:00:00.000Z`));
}

export function clampDateToTrip(trip: Trip, dayDate: string | null | undefined): string {
  if (!dayDate) {
    return trip.startDate;
  }

  if (dayDate < trip.startDate) {
    return trip.startDate;
  }

  if (dayDate > trip.endDate) {
    return trip.endDate;
  }

  return dayDate;
}
