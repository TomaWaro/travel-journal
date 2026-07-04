import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/server-access";
import { appendTrackPoint, stopTrackSession } from "@/lib/store";

type RouteProps = {
  params: Promise<{ sessionId: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { sessionId } = await params;
    await requireDashboardAccess(request, ["owner", "contributor"]);
    const body = (await request.json()) as {
      action: "append" | "stop";
      latitude?: number;
      longitude?: number;
      accuracyMeters?: number | null;
    };

    if (body.action === "append") {
      if (typeof body.latitude !== "number" || typeof body.longitude !== "number") {
        throw new Error("Missing coordinates");
      }

      const point = await appendTrackPoint(
        sessionId,
        body.latitude,
        body.longitude,
        body.accuracyMeters ?? null
      );

      return NextResponse.json({ point });
    }

    const session = await stopTrackSession(sessionId);
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update track session" },
      { status: 400 }
    );
  }
}
