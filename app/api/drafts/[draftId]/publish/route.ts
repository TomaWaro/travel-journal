import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/server-access";
import { publishDraft } from "@/lib/store";

type RouteProps = {
  params: Promise<{ draftId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { draftId } = await params;
    await requireDashboardAccess(request, ["owner"]);
    const story = await publishDraft(draftId);

    return NextResponse.json({ story });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to publish draft" },
      { status: 400 }
    );
  }
}
