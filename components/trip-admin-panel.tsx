"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Member, Trip, RouteLeg } from "@/lib/types";

type Props = {
  token: string;
  trip: Trip;
  members: Member[];
  legs?: RouteLeg[];
  mode: "settings" | "legs" | "invites";
};

export function TripAdminPanel({ token, trip, members, legs = [], mode }: Props) {
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
      <div className="panel-heading workspace-panel-heading">
        <div>
          <p className="eyebrow">Edition owner</p>
          <h2>
            {mode === "settings"
              ? "Regler le voyage"
              : mode === "legs"
                ? "Ajouter une etape"
                : "Inviter un contributeur"}
          </h2>
        </div>
      </div>

      <div className="workspace-form-shell">
        {mode === "settings" ? (
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
        ) : null}

        {mode === "legs" ? (
        <div className="stack" style={{ gap: "24px" }}>
          {legs.length > 0 ? (
            <div style={{ padding: "16px", background: "rgba(20,32,50,0.02)", borderRadius: "16px", border: "1px solid rgba(20,32,50,0.06)" }}>
              <h4 style={{ marginBottom: "12px", color: "var(--ink)" }}>Itinéraires enregistrés</h4>
              <ul className="stack" style={{ listStyle: "none", padding: 0, gap: "10px", margin: 0 }}>
                {legs.map((leg) => (
                  <li key={leg.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#ffffff", borderRadius: "12px", border: "1px solid rgba(20,32,50,0.05)", boxShadow: "0 2px 5px rgba(0,0,0,0.01)" }}>
                    <div>
                      <strong style={{ display: "block", color: "var(--ink)" }}>{leg.title}</strong>
                      <small style={{ color: "var(--ink-soft)" }}>
                        {leg.dayDate ? new Date(leg.dayDate).toLocaleDateString("fr-FR", { dateStyle: "medium" }) : "Pas de date"}
                        {leg.rawGoogleMapsUrl ? " · Lien Google Maps actif" : " · Tracé manuel"}
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Voulez-vous vraiment supprimer cet itinéraire ?")) return;
                        const response = await fetch(`/api/trips/${trip.id}/legs/import-google`, {
                          method: "DELETE",
                          headers: {
                            "Content-Type": "application/json",
                            "x-access-token": token
                          },
                          body: JSON.stringify({ legId: leg.id })
                        });
                        if (response.ok) {
                          router.refresh();
                        } else {
                          alert("Erreur lors de la suppression de l'itinéraire.");
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(255, 76, 76, 0.1)",
                        color: "rgb(255, 76, 76)",
                        border: "0",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.85rem"
                      }}
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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
        </div>
        ) : null}

        {mode === "invites" ? (
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
        ) : null}
      </div>

      {message ? <p className="status-line">{message}</p> : null}
    </section>
  );
}
