import { NextResponse } from "next/server";
import { addPublicComment, deletePublicComment } from "@/lib/store";

type RouteProps = {
  params: Promise<{ momentId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { momentId } = await params;
    const body = (await request.json()) as {
      authorName?: string;
      body?: string;
      tripId?: string;
    };
    const tripId = String(body.tripId ?? "");

    if (!tripId) {
      throw new Error("Trip ID is required.");
    }

    const comment = await addPublicComment({
      tripId,
      storyId: null,
      momentId,
      authorName: String(body.authorName ?? ""),
      body: String(body.body ?? "")
    });

    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add comment" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteProps) {
  try {
    const { momentId } = await params;
    const body = (await request.json()) as {
      authorName?: string;
      body?: string;
      tripId?: string;
    };
    const tripId = String(body.tripId ?? "");
    const authorName = String(body.authorName ?? "");
    const emojiBody = String(body.body ?? "");

    if (!tripId) {
      throw new Error("Trip ID is required.");
    }
    if (!authorName || !emojiBody) {
      throw new Error("Author name and emoji body are required.");
    }

    const success = await deletePublicComment({
      tripId,
      momentId,
      authorName,
      body: emojiBody
    });

    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete reaction" },
      { status: 400 }
    );
  }
}
