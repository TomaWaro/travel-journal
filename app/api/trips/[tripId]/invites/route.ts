import { NextResponse } from "next/server";
import { appEnv } from "@/lib/env";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";
import { createInvite } from "@/lib/store";

type RouteProps = {
  params: Promise<{ tripId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { tripId } = await params;
    const dashboard = await requireDashboardAccess(request, ["owner"]);
    requireTripAccess(dashboard, tripId);
    const body = (await request.json()) as { memberId: string; label: string };
    const invite = await createInvite(tripId, body.memberId, body.label);
    const link = new URL(`/access/${invite.token}?trip=${tripId}`, appEnv.appUrl).toString();

    return NextResponse.json({ invite, link });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invite" },
      { status: 400 }
    );
  }
}
