export type Project = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: "Web apps" | "Creative coding" | "UI experiments";
  stack: string[];
  preview: "orbit" | "resonance" | "fieldnotes" | "chromatic";
  featured: boolean;
  githubUrl: string | null;
  liveUrl: string | null;
  details: string;
  placeholder: boolean;
};

// Original illustrative concepts, not claims of completed client or personal work.
export const projects: Project[] = [
  {
    id: "orbit",
    title: "Orbit",
    subtitle: "A little space to focus.",
    description:
      "An exploration of a calmer, more intentional digital workspace.",
    category: "Web apps",
    stack: ["Next.js", "TypeScript", "Tailwind CSS"],
    preview: "orbit",
    featured: true,
    githubUrl: null,
    liveUrl: null,
    placeholder: true,
    details:
      "An illustrative workspace concept with an editorial dashboard, a focused task list, and a soft lavender palette. Replace this entry with a real project: explain the problem, your role, the decisions you made, and what you learned. The preview is original HTML and CSS; no finished product or client relationship is implied.",
  },
  {
    id: "resonance",
    title: "Resonance",
    subtitle: "Turn sound into something you can see.",
    description:
      "A visual identity study for an experimental sound experience.",
    category: "Creative coding",
    stack: ["Three.js", "React", "Motion"],
    preview: "resonance",
    featured: true,
    githubUrl: null,
    liveUrl: null,
    placeholder: true,
    details:
      "An original visual concept exploring rhythm through repeating sculptural lines. This is a static, illustrative project preview, not an audio application. Replace this with the story of your own creative coding work and add verified source and demo links.",
  },
  {
    id: "fieldnotes",
    title: "Fieldnotes",
    subtitle: "Less scrolling. More wandering.",
    description:
      "An outdoor discovery concept inspired by the places in between.",
    category: "Web apps",
    stack: ["React", "TypeScript", "CSS"],
    preview: "fieldnotes",
    featured: false,
    githubUrl: null,
    liveUrl: null,
    placeholder: true,
    details:
      "A fictional outdoor discovery interface with an original CSS landscape. Use this space to describe a genuine project and its implementation. No travel data, bookings, or location services are connected to this illustrative preview.",
  },
  {
    id: "chromatic",
    title: "Chromatic",
    subtitle: "Good things happen between colors.",
    description:
      "A playful study of color, composition, and small interactions.",
    category: "UI experiments",
    stack: ["React", "CSS", "Motion"],
    preview: "chromatic",
    featured: false,
    githubUrl: null,
    liveUrl: null,
    placeholder: true,
    details:
      "An original color-composition concept. Try the working Color Field experiment further down this portfolio for a related interaction. Replace this project with your own experiment, document its behavior, and add real links when ready.",
  },
];

export const categories = [
  "All work",
  "Web apps",
  "Creative coding",
  "UI experiments",
] as const;
