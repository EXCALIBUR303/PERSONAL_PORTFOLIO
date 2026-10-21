export const education = {
  degree: "B.Tech",
  specialization: "Computer Science and Engineering",
  university: null as string | null,
  period: null as string | null,
  academicYear: null as string | null,
  coursework: [] as string[],
  interests: [
    "AI & intelligent systems",
    "Algorithms",
    "Sustainable engineering",
  ],
  // Fill these fields only with confirmed academic details.
  activities: [] as { title: string; description: string; url?: string }[],
};
