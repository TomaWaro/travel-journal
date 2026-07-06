import { NextResponse } from "next/server";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";
import { updateTripSettings } from "@/lib/store";
import { parseGoogleMapsLeg } from "@/lib/google-maps";

type RouteProps = {
  params: Promise<{ tripId: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { tripId } = await params;
    const dashboard = await requireDashboardAccess(request, ["owner"]);
    requireTripAccess(dashboard, tripId);
    const patch = (await request.json()) as {
      summary?: string;
      visibility?: "private" | "quasi-public";
      mapPrivacy?: "delayed" | "completed-only";
      mapDelayMinutes?: number;
      published?: boolean;
      liveTrackingUrl?: string | null;
      liveTrackingPath?: string | null;
    };

    if (patch.liveTrackingUrl !== undefined) {
      if (patch.liveTrackingUrl === null) {
        patch.liveTrackingPath = null;
      } else {
        try {
          const parsed = await parseGoogleMapsLeg(tripId, patch.liveTrackingUrl, null);
          if (parsed.plannedPath && parsed.plannedPath.length >= 2) {
            patch.liveTrackingPath = JSON.stringify(parsed.plannedPath);
          } else {
            patch.liveTrackingPath = null;
          }
        } catch (e) {
          console.error("Failed to parse liveTrackingUrl:", e);
          patch.liveTrackingPath = null;
        }
      }
    }

    const trip = await updateTripSettings(tripId, patch);

    return NextResponse.json({ trip });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update trip" },
      { status: 400 }
    );
  }
}
