import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/server-access";
import { unpublishStory } from "@/lib/store";

type RouteProps = {
  params: Promise<{ storyId: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const { storyId } = await params;
    await requireDashboardAccess(request, ["owner"]);
    const body = (await request.json()) as { action?: string };

    if (body.action !== "unpublish") {
      throw new Error("Unsupported action");
    }

    await unpublishStory(storyId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update publication" },
      { status: 400 }
    );
  }
}
