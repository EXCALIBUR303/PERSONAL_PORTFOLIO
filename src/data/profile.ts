// Replace the clearly marked template content here before sharing your portfolio.
export const profile = {
  name: "Your name",
  initials: "YN",
  role: "Creative developer",
  headline: ["Making digital", "feel a little", "more human."],
  introduction:
    "Thoughtful interfaces. Playful interactions. A little unexpected magic. A space for the things I make at the intersection of design and code.",
  availability: "Add your availability",
  about:
    "This is where your story begins. Introduce yourself, what brought you to development, and the kind of work that makes you lose track of time.",
  focus: "Add what you’re learning or building right now.",
  background: "Add your academic or professional background.",
  interests: ["Thoughtful interfaces", "Creative coding", "The small details"],
  // Null values render honest, disabled states. Add your real destinations.
  email: null as string | null,
  socials: [
    { name: "GitHub", url: null as string | null },
    { name: "LinkedIn", url: null as string | null },
  ],
  skills: [
    {
      title: "The interface",
      subtitle: "Frontend & interaction",
      icon: "code",
      items: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Motion"],
    },
    {
      title: "The dimension",
      subtitle: "Creative development",
      icon: "shapes",
      items: ["Three.js", "React Three Fiber", "WebGL", "CSS animation"],
    },
    {
      title: "The engine",
      subtitle: "Backend & data",
      icon: "database",
      items: ["Add your backend tools", "Add your database"],
    },
    {
      title: "The process",
      subtitle: "Tools & collaboration",
      icon: "terminal",
      items: ["Git", "VS Code", "Add your design tools"],
    },
  ],
  journey: [
    {
      date: "YOUR DATES",
      title: "Your education",
      organization: "Institution · Degree or program",
      description: "Add your field of study and the ideas you explored.",
    },
    {
      date: "YOUR DATES",
      title: "Your experience",
      organization: "Organization · Role",
      description:
        "Add relevant work, an internship, or an independent project.",
    },
    {
      date: "YOUR DATES",
      title: "A milestone that matters",
      organization: "Certification, hackathon, or research",
      description: "Add an achievement and a verified link when available.",
    },
  ],
};

export const site = {
  title: "Your name — Creative developer",
  description:
    "A creative developer portfolio exploring thoughtful interfaces, expressive code, and interactive digital experiences.",
  // Set an absolute production origin to enable canonical metadata and sitemap.
  url: "https://form-function-creative-lab.starry-hare-3759.chatgpt.site" as
    string | null,
};
