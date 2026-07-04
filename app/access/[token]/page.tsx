import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { appEnv } from "@/lib/env";
import { getDashboardView } from "@/lib/store";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ trip?: string }>;
};

export default async function AccessPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const { trip: selectedTripId } = await searchParams;
  const dashboard = await getDashboardView(token);

  if (!dashboard) {
    notFound();
  }

  const selectedTrip =
    dashboard.trips.find((trip) => trip.trip.id === selectedTripId) ?? dashboard.trips[0];

  if (!selectedTrip) {
    notFound();
  }

  const publicUrl = new URL(`/t/${selectedTrip.trip.slug}`, appEnv.appUrl).toString();

  return (
    <DashboardShell
      blobUploadsEnabled={appEnv.blobConfigured}
      dashboard={dashboard}
      publicUrl={publicUrl}
      selectedTrip={selectedTrip}
      token={token}
    />
  );
}
