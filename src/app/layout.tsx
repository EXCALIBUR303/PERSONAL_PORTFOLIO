import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/data/profile";
import "./globals.css";
import "./multiverse.css";
import "./universe.css";
import AppFrame from "@/components/app-frame";

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
export const viewport: Viewport = { themeColor: "#141613" };
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
