import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects, getProject } from "@/data/projects";
import { site } from "@/data/profile";
import ProjectWorld from "@/features/worlds/project-world";
export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "World not found" };
  return {
    title: `${project.title} — Sidharth Sood / Devfolio V2`,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}/` },
    openGraph: {
      title: `${project.title} / The Project Multiverse`,
      description: project.description,
      url: site.url ? `${site.url}/projects/${project.slug}` : undefined,
      type: "website",
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: `${project.title} / Devfolio V2`,
        },
      ],
    },
  };
}
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const index = projects.findIndex((item) => item.slug === slug),
    next = projects[(index + 1) % projects.length];
  return (
    <ProjectWorld
      project={project}
      index={index}
      count={projects.length}
      nextProject={{ slug: next.slug, title: next.title }}
    />
  );
}
