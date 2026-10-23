"use client";
import { projects } from "@/data/projects";
import { usePortfolioState } from "./app-frame";

/**
 * The one place the gallery filters are applied. Both the Professional and the
 * Creative gallery render the result, so search, collection, type, category
 * and "featured" behave identically and share state across mode switches.
 */
export function useGalleryFilter() {
  const { gallery, setGallery, beginPortal } = usePortfolioState();
  const query = gallery.query.toLowerCase().trim();
  const filtered = projects.filter(
    (project) =>
      (gallery.collection === "All" ||
        project.collection === gallery.collection) &&
      (gallery.discipline === "All" ||
        project.discipline === gallery.discipline) &&
      (gallery.category === "All worlds" ||
        project.categories.includes(gallery.category)) &&
      (!gallery.featuredOnly || project.featured) &&
      `${project.title} ${project.description} ${project.stack.join(" ")} ${project.categories.join(" ")}`
        .toLowerCase()
        .includes(query),
  );
  const spotlight =
    filtered.find((p) => p.slug === gallery.selectedSlug) || filtered[0];
  function reset() {
    setGallery({
      ...gallery,
      query: "",
      category: "All worlds",
      featuredOnly: false,
      collection: "All",
      discipline: "All",
    });
  }
  return { gallery, setGallery, beginPortal, filtered, spotlight, reset };
}
