"use client";

import { uploadPresigned } from "@vercel/blob/client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  blobUploadsEnabled: boolean;
  token: string;
  tripId: string;
  publicUrl: string;
};

type UploadedAsset = {
  id: string;
  mimeType: string;
  path: string;
  sizeBytes: number;
  type: "photo" | "video" | "audio" | "text";
  url: string;
};

async function getCurrentCoordinates() {
  if (!("geolocation" in navigator)) {
    return { latitude: null, longitude: null };
  }

  return new Promise<{ latitude: number | null; longitude: number | null }>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => {
        resolve({ latitude: null, longitude: null });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000
      }
    );
  });
}

function sanitizeFilename(filename: string): string {
  const [baseName, extension = ""] = filename.split(/\.(?=[^.]+$)/);
  const safeBase = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const safeExtension = extension.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();

  return safeExtension ? `${safeBase || "media"}.${safeExtension}` : safeBase || "media";
}

function inferMomentTypeFromFile(file: File): UploadedAsset["type"] {
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

export function CapturePanel({ blobUploadsEnabled, token, tripId, publicUrl }: Props) {
  const router = useRouter();
  const watchIdRef = useRef<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [attachLocation, setAttachLocation] = useState<boolean>(true);
  const [tracking, setTracking] = useState<boolean>(false);
  const [trackSessionId, setTrackSessionId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  async function uploadAsset(file: File): Promise<UploadedAsset> {
    const assetId = crypto.randomUUID();
    const pathname = `trips/${tripId}/${assetId}-${sanitizeFilename(file.name)}`;
    const blob = await uploadPresigned(pathname, file, {
      access: "public",
      contentType: file.type || undefined,
      handleUploadUrl: `/api/trips/${tripId}/moments/upload`,
      headers: {
        "x-access-token": token
      },
      multipart: file.size > 4 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => {
        setUploadProgress(Math.round(percentage));
      }
    });

    return {
      id: assetId,
      mimeType: file.type || "application/octet-stream",
      path: blob.pathname,
      sizeBytes: file.size,
      type: inferMomentTypeFromFile(file),
      url: blob.url
    };
  }

  async function handleSubmit(formData: FormData) {
    try {
      const location = attachLocation ? await getCurrentCoordinates() : { latitude: null, longitude: null };
      formData.set("latitude", location.latitude?.toString() ?? "");
      formData.set("longitude", location.longitude?.toString() ?? "");
      const uploaded = formData.get("file");
      const file = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;

      if (blobUploadsEnabled && file) {
        setMessage("Upload du media vers Blob...");
        const asset = await uploadAsset(file);
        formData.delete("file");
        formData.set("uploadedAssetId", asset.id);
        formData.set("uploadedAssetPath", asset.path);
        formData.set("uploadedAssetUrl", asset.url);
        formData.set("uploadedAssetMimeType", asset.mimeType);
        formData.set("uploadedAssetSizeBytes", String(asset.sizeBytes));
        formData.set("uploadedAssetType", asset.type);
      }

      const response = await fetch(`/api/trips/${tripId}/moments`, {
        method: "POST",
        headers: {
          "x-access-token": token
        },
        body: formData
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error ?? "Impossible d'ajouter le moment.");
        return;
      }

      setMessage("Moment ajoute.");
      router.refresh();
    } finally {
      setUploadProgress(null);
    }
  }

  async function startTracking() {
    if (!("geolocation" in navigator)) {
      setMessage("La geolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }

    const response = await fetch("/api/track-sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token
      },
      body: JSON.stringify({ tripId })
    });
    const payload = (await response.json()) as { sessionId?: string; error?: string };

    if (!response.ok || !payload.sessionId) {
      setMessage(payload.error ?? "Impossible de demarrer le suivi.");
      return;
    }

    const sessionId = payload.sessionId;
    setTrackSessionId(sessionId);
    setTracking(true);
    setMessage("Suivi GPS demarre.");

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        await fetch(`/api/track-sessions/${sessionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": token
          },
          body: JSON.stringify({
            action: "append",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy
          })
        });
      },
      () => {
        setMessage("Le suivi a perdu la position. Vous pouvez relancer plus tard.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );
  }

  async function stopTracking() {
    if (!trackSessionId) {
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    await fetch(`/api/track-sessions/${trackSessionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token
      },
      body: JSON.stringify({ action: "stop" })
    });

    setTracking(false);
    setTrackSessionId(null);
    setMessage("Suivi GPS arrete.");
    router.refresh();
  }

  async function sharePublicLink() {
    if (!navigator.share) {
      setMessage("Le partage natif n'est pas disponible sur ce navigateur.");
      return;
    }

    try {
      await navigator.share({
        title: "Travel Journal",
        text: "Suivre notre trajet et les recap du voyage",
        url: publicUrl
      });
    } catch {
      setMessage("Partage annule.");
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Capture</p>
          <h2>Ajouter vite depuis le telephone</h2>
        </div>
        <button className="ghost-button" onClick={sharePublicLink} type="button">
          Partager le lien public
        </button>
      </div>

      <form
        className="stack"
        onSubmit={async (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          await handleSubmit(formData);
          event.currentTarget.reset();
        }}
      >
        <label className="field">
          <span>Media</span>
          <input accept="image/*,video/*,audio/*" name="file" type="file" />
        </label>
        <label className="field">
          <span>Legende</span>
          <input name="caption" placeholder="Ex: Deja sur la route vers Lunel" type="text" />
        </label>
        <label className="field">
          <span>Texte / note</span>
          <textarea name="body" placeholder="Un mot, une pensee, un mini recap..." rows={4} />
        </label>
        <label className="field">
          <span>Date du jour</span>
          <input defaultValue={new Date().toISOString().slice(0, 10)} name="dayDate" type="date" />
        </label>
        <label className="checkbox">
          <input
            checked={attachLocation}
            onChange={(event) => setAttachLocation(event.target.checked)}
            type="checkbox"
          />
          <span>Joindre ma position au moment</span>
        </label>
        <div className="button-row">
          <button className="primary-button" type="submit">
            Enregistrer le moment
          </button>
          {!tracking ? (
            <button className="secondary-button" onClick={startTracking} type="button">
              Demarrer le suivi
            </button>
          ) : (
            <button className="secondary-button" onClick={stopTracking} type="button">
              Arreter le suivi
            </button>
          )}
        </div>
      </form>

      {uploadProgress !== null ? (
        <p className="status-line">Upload media: {uploadProgress}%</p>
      ) : null}
      {message ? <p className="status-line">{message}</p> : null}
    </section>
  );
}
