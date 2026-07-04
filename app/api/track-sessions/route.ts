import { NextResponse } from "next/server";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";
import { startTrackSession } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const dashboard = await requireDashboardAccess(request, ["owner", "contributor"]);
    const body = (await request.json()) as { tripId: string };
    requireTripAccess(dashboard, body.tripId);
    const session = await startTrackSession(body.tripId, dashboard.access.member.id);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start track session" },
      { status: 400 }
    );
  }
}
