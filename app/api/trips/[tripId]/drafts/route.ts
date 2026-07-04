import { NextResponse } from "next/server";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";
import { generateDraft } from "@/lib/store";

type RouteProps = {
  params: Promise<{ tripId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { tripId } = await params;
    const dashboard = await requireDashboardAccess(request, ["owner"]);
    requireTripAccess(dashboard, tripId);
    const body = (await request.json()) as { dayDate?: string | null };
    const draft = await generateDraft(tripId, body.dayDate ?? null);

    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate draft" },
      { status: 400 }
    );
  }
}
