import { getAccessTokenFromRequest } from "@/lib/access";
import { getDashboardView } from "@/lib/store";
import type { AccessRole, DashboardView, TripBundle } from "@/lib/types";

export async function requireDashboardAccess(
  request: Request,
  acceptedRoles?: AccessRole[]
): Promise<DashboardView> {
  const token = getAccessTokenFromRequest(request);

  if (!token) {
    throw new Error("Missing access token");
  }

  const dashboard = await getDashboardView(token);

  if (!dashboard) {
    throw new Error("Invalid access token");
  }

  if (acceptedRoles && !acceptedRoles.includes(dashboard.role)) {
    throw new Error("You do not have permission to perform this action");
  }

  return dashboard;
}

export function requireTripAccess(dashboard: DashboardView, tripId: string): TripBundle {
  const trip = dashboard.trips.find((candidate) => candidate.trip.id === tripId);

  if (!trip) {
    throw new Error("Trip is not accessible with this token");
  }

  return trip;
}
