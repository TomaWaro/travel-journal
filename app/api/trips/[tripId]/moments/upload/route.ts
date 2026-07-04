import { issueSignedToken } from "@vercel/blob";
import {
  handleUploadPresigned,
  type HandleUploadPresignedBody
} from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";

type RouteProps = {
  params: Promise<{ tripId: string }>;
};

export const runtime = "nodejs";

export async function POST(request: Request, { params }: RouteProps) {
  try {
    if (!process.env.BLOB_WEBHOOK_PUBLIC_KEY) {
      throw new Error("Vercel Blob is not configured.");
    }

    const { tripId } = await params;
    const body = (await request.json()) as HandleUploadPresignedBody;
    const jsonResponse = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        const dashboard = await requireDashboardAccess(request, ["owner", "contributor"]);
        requireTripAccess(dashboard, tripId);

        if (!pathname.startsWith(`trips/${tripId}/`)) {
          throw new Error("Invalid upload destination.");
        }

        const validUntil = Date.now() + 60 * 60 * 1000;

        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: ["image/*", "video/*", "audio/*"],
            maximumSizeInBytes: 1024 * 1024 * 512,
            validUntil
          }),
          urlOptions: {
            allowedContentTypes: ["image/*", "video/*", "audio/*"],
            maximumSizeInBytes: 1024 * 1024 * 512,
            validUntil,
            addRandomSuffix: false,
            allowOverwrite: false
          }
        };
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to prepare upload" },
      { status: 400 }
    );
  }
}
