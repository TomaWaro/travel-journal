import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";

type RouteProps = {
  params: Promise<{ tripId: string }>;
};

export const runtime = "nodejs";

export async function POST(request: Request, { params }: RouteProps) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Vercel Blob is not configured.");
    }

    const { tripId } = await params;
    const dashboard = await requireDashboardAccess(request, ["owner", "contributor"]);
    requireTripAccess(dashboard, tripId);
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`trips/${tripId}/`)) {
          throw new Error("Invalid upload destination.");
        }

        return {
          allowedContentTypes: ["image/*", "video/*", "audio/*"],
          maximumSizeInBytes: 1024 * 1024 * 512,
          addRandomSuffix: false
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
