export type Experience = {
  role: string;
  organization: string;
  period: string | null;
  type: "Academic" | "Independent" | "Professional";
  responsibilities: string[];
  outcomes: string[];
  projectSlug: string;
  evidenceUrl: string | null;
};
export const experience: Experience[] = [
  {
    role: "Independent project exploration",
    organization: "Public engineering projects",
    period: null,
    type: "Independent",
    responsibilities: [
      "Exploring model pipelines, graph search, relational systems, and interactive applications through the linked repositories.",
    ],
    outcomes: [
      "Inspect implementation evidence inside each project world. No employer or internship history has been supplied.",
    ],
    projectSlug: "mazera-ai-maze-solver",
    evidenceUrl: "https://github.com/EXCALIBUR303",
  },
];
