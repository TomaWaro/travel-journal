import { NextResponse } from "next/server";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";
import { updateTripSettings } from "@/lib/store";

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
    };
    const trip = await updateTripSettings(tripId, patch);

    return NextResponse.json({ trip });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update trip" },
      { status: 400 }
    );
  }
}
