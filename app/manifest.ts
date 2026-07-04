import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Travel Journal",
    short_name: "Travel Journal",
    description: "Phone-first travel journal with maps, drafts, and shareable public pages.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1720",
    theme_color: "#f18f5c",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
