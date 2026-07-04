"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Member, Trip } from "@/lib/types";

type Props = {
  token: string;
  trip: Trip;
  members: Member[];
};

export function TripAdminPanel({ token, trip, members }: Props) {
  const router = useRouter();
  const [inviteLink, setInviteLink] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  async function postJson(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token
      },
      body: JSON.stringify(body)
    });

    return response;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Edition owner</p>
          <h2>Configurer le voyage et les acces</h2>
        </div>
      </div>

      <div className="admin-grid">
        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const response = await fetch(`/api/trips/${trip.id}/settings`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "x-access-token": token
              },
              body: JSON.stringify({
                summary: formData.get("summary"),
                visibility: formData.get("visibility"),
                mapPrivacy: formData.get("mapPrivacy"),
                mapDelayMinutes: Number(formData.get("mapDelayMinutes")),
                published: formData.get("published") === "on"
              })
            });

            if (!response.ok) {
              setMessage("Impossible de sauvegarder les reglages.");
              return;
            }

            setMessage("Reglages du voyage mis a jour.");
            router.refresh();
          }}
        >
          <h3>Reglages</h3>
          <label className="field">
            <span>Resume public</span>
            <textarea defaultValue={trip.summary} name="summary" rows={4} />
          </label>
          <label className="field">
            <span>Visibilite</span>
            <select defaultValue={trip.visibility} name="visibility">
              <option value="private">Prive</option>
              <option value="quasi-public">Quasi-public</option>
            </select>
          </label>
          <label className="field">
            <span>Mode carte</span>
            <select defaultValue={trip.mapPrivacy} name="mapPrivacy">
              <option value="delayed">Position retardee</option>
              <option value="completed-only">Segments termines</option>
            </select>
          </label>
          <label className="field">
            <span>Delai carte (minutes)</span>
            <input defaultValue={trip.mapDelayMinutes} min={0} name="mapDelayMinutes" type="number" />
          </label>
          <label className="checkbox">
            <input defaultChecked={trip.published} name="published" type="checkbox" />
            <span>Trip visible publiquement</span>
          </label>
          <button className="primary-button" type="submit">
            Sauvegarder
          </button>
        </form>

        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const response = await postJson(`/api/trips/${trip.id}/legs/import-google`, {
              googleMapsUrl: formData.get("googleMapsUrl"),
              dayDate: formData.get("dayDate"),
              title: formData.get("title"),
              originLabel: formData.get("originLabel"),
              destinationLabel: formData.get("destinationLabel"),
              travelMode: formData.get("travelMode")
            });

            if (!response.ok) {
              setMessage("Impossible d'ajouter le leg.");
              return;
            }

            setMessage("Leg ajoute.");
            event.currentTarget.reset();
            router.refresh();
          }}
        >
          <h3>Leg planifie</h3>
          <label className="field">
            <span>Lien Google Maps</span>
            <input name="googleMapsUrl" placeholder="https://www.google.com/maps/dir/?api=1&..." type="url" />
          </label>
          <label className="field">
            <span>Ou titre manuel</span>
            <input name="title" placeholder="Cap sur la Costa Brava" type="text" />
          </label>
          <label className="field">
            <span>Depart</span>
            <input name="originLabel" placeholder="Lunel" type="text" />
          </label>
          <label className="field">
            <span>Arrivee</span>
            <input name="destinationLabel" placeholder="Costa Brava" type="text" />
          </label>
          <label className="field">
            <span>Date</span>
            <input name="dayDate" type="date" />
          </label>
          <label className="field">
            <span>Mode</span>
            <select defaultValue="driving" name="travelMode">
              <option value="driving">Voiture</option>
              <option value="walking">Marche</option>
              <option value="transit">Transport</option>
              <option value="cycling">Velo</option>
            </select>
          </label>
          <button className="secondary-button" type="submit">
            Ajouter le leg
          </button>
        </form>

        <form
          className="stack"
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const response = await postJson(`/api/trips/${trip.id}/invites`, {
              memberId: formData.get("memberId"),
              label: formData.get("label")
            });
            const payload = (await response.json()) as { link?: string; error?: string };

            if (!response.ok || !payload.link) {
              setMessage(payload.error ?? "Impossible de creer un acces.");
              return;
            }

            setInviteLink(payload.link);
            setMessage("Nouveau lien contributeur genere.");
            router.refresh();
          }}
        >
          <h3>Inviter un contributeur</h3>
          <label className="field">
            <span>Membre</span>
            <select name="memberId">
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Libelle</span>
            <input defaultValue="Nouveau telephone" name="label" type="text" />
          </label>
          <button className="secondary-button" type="submit">
            Generer un lien
          </button>
          {inviteLink ? (
            <div className="status-box">
              <span>Lien genere</span>
              <code>{inviteLink}</code>
            </div>
          ) : null}
        </form>
      </div>

      {message ? <p className="status-line">{message}</p> : null}
    </section>
  );
}
