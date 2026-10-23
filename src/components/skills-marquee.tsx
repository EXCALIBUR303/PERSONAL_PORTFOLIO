import { skills } from "@/data/skills";

/** A scrolling strip of technologies that are actually used in listed projects. */
const names = Array.from(
  new Set(
    skills
      .filter((skill) => skill.status === "Used in a project")
      .map((skill) => skill.name),
  ),
);

export default function SkillsMarquee() {
  return (
    <div
      className="skills-marquee"
      role="group"
      aria-label="Technologies used in these projects"
    >
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
            {names.map((name) => (
              <li key={name}>
                <span>{name}</span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
