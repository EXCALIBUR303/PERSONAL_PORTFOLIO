import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { milestones } from "@/data/milestones";

/**
 * The part of About that used to be a separate Chapters section. Only
 * source-backed highlights are listed; dates, employers and awards are left
 * out until they are confirmed.
 */
export default function Highlights({ variant }: { variant: "pro" | "creative" }) {
  return (
    <div id="highlights" className={variant === "pro" ? "about-highlights" : "c-highlights"}>
      <h3 className="mono">Highlights from the work</h3>
      <ul>
        {milestones.map((item) => (
          <li key={item.title}>
            <Link href={`/projects/${item.projectSlug}/`} prefetch={false}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
