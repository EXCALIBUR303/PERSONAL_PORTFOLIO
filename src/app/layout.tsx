import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import {
  Familjen_Grotesk,
  Instrument_Serif,
  JetBrains_Mono,
  Playfair_Display,
} from "next/font/google";
import { site } from "@/data/profile";
import "./globals.css";
import "./multiverse.css";
import "./universe.css";
import "./modes.css";
import "./hero.css";
import "./lens.css";
import "./project.css";
import "./creative.css";
import AppFrame from "@/components/app-frame";
import { modeBootScript } from "@/components/mode";

const display = localFont({
  src: "../../public/fonts/space-grotesk-latin.woff2",
  variable: "--font-display",
  display: "swap",
});
const body = localFont({
  src: "../../public/fonts/inter-latin.woff2",
  variable: "--font-body",
  display: "swap",
});
// Professional mode: editorial serif + technical mono.
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
// Creative mode faces are only fetched when that mode actually uses them.
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
  preload: false,
});
const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  variable: "--font-familjen",
  display: "swap",
  preload: false,
});
export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  icons: { icon: "/icon.svg" },
  ...(site.url
    ? { metadataBase: new URL(site.url), alternates: { canonical: "/" } }
    : {}),
  openGraph: {
    title: site.title,
    description: site.description,
    type: "website",
    ...(site.url
      ? {
          images: [
            {
              url: "/opengraph-image.png",
              width: 1200,
              height: 630,
              alt: "Form & Function — creative developer portfolio",
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
};
export const viewport: Viewport = { themeColor: "#F7F6F0" };
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-mode="pro" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeBootScript }} />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${playfair.variable} ${mono.variable} ${instrument.variable} ${familjen.variable}`}
      >
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
