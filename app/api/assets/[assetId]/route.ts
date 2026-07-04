import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getAsset } from "@/lib/store";
import { localAssetPath } from "@/lib/stores/file-store";

type RouteProps = {
  params: Promise<{ assetId: string }>;
};

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteProps) {
  const { assetId } = await params;
  const asset = await getAsset(assetId);

  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  if (asset.storage === "blob") {
    return NextResponse.redirect(asset.url);
  }

  const bytes = await readFile(localAssetPath(asset));
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
