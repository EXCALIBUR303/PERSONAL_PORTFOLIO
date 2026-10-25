"use client";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { bench } from "../creative-about";
import { districts, type District } from "../identity";
import { stations } from "./stations";

/**
 * The Studio's panel: the welcome, the way to the notebook About, what is on
 * the bench, this tab's experiment passport, and the three districts. Every
 * line is taken from the profile and project data or from this tab's own
 * progress; nothing here is new copy about the person.
 */
export function StudioCard({
  visited,
  challenges,
  onClose,
  onDistrict,
}: {
  visited: string[];
  challenges: string[];
  onClose: () => void;
  onDistrict: (district: District) => void;
}) {
  const opened = stations.filter((s) => visited.includes(s.slug)).length;
  const withChallenge = stations.filter((s) => s.challenge);
  const tried = withChallenge.filter((s) => challenges.includes(s.slug)).length;
  return (
    <aside className="c-brief w-studio-card" aria-label="The Studio" data-tier="studio">
      <button type="button" className="c-brief-close" onClick={onClose} aria-label="Close the Studio panel">
        <X size={16} aria-hidden="true" />
      </button>
      <p className="c-brief-no mono">The Studio · Welcome</p>
      <h2>The Studio</h2>
      <p className="c-brief-tag">{profile.focus}</p>
      <div className="c-brief-actions">
        <a href="#about" className="c-btn c-btn-lime">
          The person behind the experiments <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>

      <section className="w-sc-section" aria-labelledby="sc-bench">
        <h3 id="sc-bench">On the bench</h3>
        <ul className="w-bench">
          {bench.map((slug) => {
            const p = projects.find((x) => x.slug === slug)!;
            return (
              <li key={slug}>
                <Link href={`/projects/${slug}/`} prefetch={false}>
                  <span>{p.status}</span>
                  {p.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="w-sc-section" aria-labelledby="sc-passport">
        <h3 id="sc-passport">Experiment passport</h3>
        <p className="w-sc-note">
          {opened} of {stations.length} stations opened and {tried} of {withChallenge.length} challenges tried in this tab.
        </p>
        <ol className="w-passport" aria-hidden="true">
          {stations.map((s) => (
            <li
              key={s.slug}
              data-district={s.district}
              data-done={visited.includes(s.slug) || undefined}
              data-challenge={challenges.includes(s.slug) || undefined}
            />
          ))}
        </ol>
        <p className="w-sc-note">Kept only in this browser tab; nothing is sent anywhere.</p>
      </section>

      <section className="w-sc-section" aria-labelledby="sc-go">
        <h3 id="sc-go">Visit a district</h3>
        <div className="w-goto">
          {districts.map((d) => (
            <button key={d.id} type="button" data-district={d.id} onClick={() => onDistrict(d.id)}>
              {d.label} <small>{stations.filter((s) => s.district === d.id).length}</small>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
