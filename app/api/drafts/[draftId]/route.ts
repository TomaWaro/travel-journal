import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/server-access";
import { deleteDraft, updateDraft } from "@/lib/store";

export async function PATCH(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  try {
    await requireDashboardAccess(request, ["owner"]);
    const { draftId } = await params;
    const body = (await request.json()) as {
      title?: string;
      summary?: string;
      body?: string;
    };
    const draft = await updateDraft(draftId, body);

    return NextResponse.json({ draft });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update draft" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ draftId: string }> }) {
  try {
    await requireDashboardAccess(request, ["owner"]);
    const { draftId } = await params;
    await deleteDraft(draftId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete draft" },
      { status: 400 }
    );
  }
}
