import { NextResponse } from "next/server";
import { parseGoogleMapsLeg, buildPlannedPath } from "@/lib/google-maps";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";
import { createLeg, deleteLeg } from "@/lib/store";

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

    let input;
    if (body.googleMapsUrl) {
      input = await parseGoogleMapsLeg(tripId, body.googleMapsUrl, body.dayDate ?? null);
    } else {
      const origin = body.originLabel || "";
      const destination = body.destinationLabel || "";
      const stops = [origin, destination].filter(Boolean);
      const plannedPath = await buildPlannedPath(stops);

      input = {
        tripId,
        dayDate: body.dayDate ?? null,
        title: body.title || `${origin || "Depart"} -> ${destination || "Arrivee"}`,
        originLabel: origin || "Depart a preciser",
        destinationLabel: destination || "Arrivee a preciser",
        waypoints: [],
        travelMode: body.travelMode || "driving",
        rawGoogleMapsUrl: null,
        plannedPath,
        needsManualCorrection: plannedPath.length < 2
      };
    }
    const leg = await createLeg(input);

    return NextResponse.json({ leg, needsManualCorrection: input.needsManualCorrection });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create leg" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const { tripId } = await params;
    const dashboard = await requireDashboardAccess(request, ["owner"]);
    requireTripAccess(dashboard, tripId);

    const body = (await request.json()) as {
      legId?: string;
    };

    if (!body.legId) {
      throw new Error("Leg ID is required.");
    }

    await deleteLeg(body.legId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete leg" },
      { status: 400 }
    );
  }
}
