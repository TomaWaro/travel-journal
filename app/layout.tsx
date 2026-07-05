import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { SiteFooter } from "@/components/site-footer";

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display"
});

const bodyFont = Geist({
  subsets: ["latin"],
  variable: "--font-body"
});

const editorialFont = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-editorial",
  weight: "400"
});

const noteFont = Caveat({
  subsets: ["latin"],
  variable: "--font-note",
  weight: ["500", "700"]
});

export const metadata: Metadata = {
  title: "Travel Journal",
  description: "Reusable travel journal with maps, mobile capture, and manual publication."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ff9d5c"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${editorialFont.variable} ${noteFont.variable}`}
      >
        <ServiceWorkerRegister />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
