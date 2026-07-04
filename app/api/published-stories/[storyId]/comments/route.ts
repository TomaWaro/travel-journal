import { NextResponse } from "next/server";
import { addPublicComment } from "@/lib/store";

type RouteProps = {
  params: Promise<{ storyId: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { storyId } = await params;
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
      storyId,
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
