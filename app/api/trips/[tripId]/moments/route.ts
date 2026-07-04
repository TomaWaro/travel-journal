import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireDashboardAccess, requireTripAccess } from "@/lib/server-access";
import { addMoment } from "@/lib/store";
import type { Asset, MomentType } from "@/lib/types";

type RouteProps = {
  params: Promise<{ tripId: string }>;
};

export const runtime = "nodejs";

function inferMomentType(file: File | null): MomentType {
  if (!file) {
    return "text";
  }

  if (file.type.startsWith("image/")) {
    return "photo";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  return "text";
}

function extensionFromFile(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? `.${parts.at(-1)}` : "";
}

async function persistAsset(tripId: string, file: File): Promise<Asset> {
  const assetId = randomUUID();

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`trips/${tripId}/${assetId}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: false
    });

    return {
      id: assetId,
      tripId,
      storage: "blob",
      path: blob.pathname,
      url: blob.url,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString()
    };
  }

  await mkdir(path.join(process.cwd(), "data", "uploads"), { recursive: true });
  const relativePath = path.join("data", "uploads", `${assetId}${extensionFromFile(file)}`);
  const absolutePath = path.join(process.cwd(), relativePath);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  return {
    id: assetId,
    tripId,
    storage: "local",
    path: relativePath,
    url: `/api/assets/${assetId}`,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString()
  };
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const { tripId } = await params;
    const dashboard = await requireDashboardAccess(request, ["owner", "contributor"]);
    requireTripAccess(dashboard, tripId);
    const formData = await request.formData();
    const uploaded = formData.get("file");
    const file = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;
    const asset = file ? await persistAsset(tripId, file) : null;
    const moment = await addMoment({
      tripId,
      memberId: dashboard.access.member.id,
      type: inferMomentType(file),
      caption: String(formData.get("caption") ?? ""),
      body: String(formData.get("body") ?? ""),
      dayDate: String(formData.get("dayDate") ?? new Date().toISOString().slice(0, 10)),
      latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
      longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
      asset
    });

    return NextResponse.json({ moment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create moment" },
      { status: 400 }
    );
  }
}
