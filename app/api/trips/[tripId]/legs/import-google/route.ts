import { NextResponse } from "next/server";
import { parseGoogleMapsLeg } from "@/lib/google-maps";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";
import { createLeg } from "@/lib/store";

type RouteProps = {
  params: Promise<{ tripId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { tripId } = await params;
    const dashboard = await requireDashboardAccess(request, ["owner"]);
    requireTripAccess(dashboard, tripId);
    const body = (await request.json()) as {
      googleMapsUrl?: string;
      dayDate?: string | null;
      title?: string;
      originLabel?: string;
      destinationLabel?: string;
      travelMode?: "driving" | "walking" | "transit" | "cycling";
    };

    const input = body.googleMapsUrl
      ? parseGoogleMapsLeg(tripId, body.googleMapsUrl, body.dayDate ?? null)
      : {
          tripId,
          dayDate: body.dayDate ?? null,
          title: body.title || `${body.originLabel || "Depart"} -> ${body.destinationLabel || "Arrivee"}`,
          originLabel: body.originLabel || "Depart a preciser",
          destinationLabel: body.destinationLabel || "Arrivee a preciser",
          waypoints: [],
          travelMode: body.travelMode || "driving",
          rawGoogleMapsUrl: null,
          plannedPath: [],
          needsManualCorrection: true
        };
    const leg = await createLeg(input);

    return NextResponse.json({ leg, needsManualCorrection: input.needsManualCorrection });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create leg" },
      { status: 400 }
    );
  }
}
