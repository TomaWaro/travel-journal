import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/server-access";
import { createTrip } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const dashboard = await requireDashboardAccess(request, ["owner"]);
    const body = (await request.json()) as {
      title: string;
      summary: string;
      startDate: string;
      endDate: string;
      visibility: "private" | "quasi-public";
      mapPrivacy: "delayed" | "completed-only";
      mapDelayMinutes: number;
    };
    const trip = await createTrip(body, dashboard.access.member.id);

    return NextResponse.json({ trip });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create trip" },
      { status: 400 }
    );
  }
}
