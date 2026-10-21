import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { site } from "@/data/profile";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return site.url
    ? [
        { url: site.url, changeFrequency: "monthly", priority: 1 },
        ...projects.map((project) => ({
          url: `${site.url}/projects/${project.slug}/`,
          changeFrequency: "monthly" as const,
          priority: 0.8,
        })),
      ]
    : [];
}
