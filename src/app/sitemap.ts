import type { MetadataRoute } from "next";
import { site } from "@/data/profile";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return site.url
    ? [{ url: site.url, changeFrequency: "monthly", priority: 1 }]
    : [];
}
