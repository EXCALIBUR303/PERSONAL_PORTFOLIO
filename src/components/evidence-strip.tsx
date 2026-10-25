import type { Project } from "@/data/projects";
import { claimClassNote, evidence } from "@/data/evidence";

/**
 * What was checked for a project, as text (never colour alone). Shared by both
 * modes' project pages and the featured cards.
 */
export function EvidenceStrip({ project }: { project: Project }) {
  const item = evidence[project.slug];
  if (!item) return null;
  const rows: [string, string[]][] = [
    ["Ran", item.ran],
    ["Read", item.read],
    ["Not checked", item.notChecked],
  ];
  return (
    <section
      className="evidence-strip"
      aria-label={`Evidence for ${project.title}`}
      data-claim={item.claimClass}
    >
      <p className="evidence-claim">
        <span className="evidence-label mono">Claim</span>
        <strong className="evidence-chip">{item.claimClass}</strong>
        <span className="evidence-note">{claimClassNote[item.claimClass]}</span>
      </p>
      <dl className="evidence-rows">
        {rows
          .filter(([, list]) => list.length > 0)
          .map(([label, list]) => (
            <div key={label} className="evidence-row">
              <dt className="evidence-label mono">{label}</dt>
              <dd>
                <ul>
                  {list.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
      </dl>
      <p className="evidence-caveat">
        <span className="evidence-label mono">Caveat</span> {item.caveat}
      </p>
      {item.auditedCommit && (
        <p className="evidence-commit mono">Audited at commit {item.auditedCommit}</p>
      )}
    </section>
  );
}

/** One line for a card: the claim, the first thing that ran, and the caveat. */
export function EvidenceLine({ project }: { project: Project }) {
  const item = evidence[project.slug];
  if (!item) return null;
  return (
    <p className="evidence-line">
      <strong className="evidence-chip">{item.claimClass}</strong>{" "}
      {item.ran[0] ? <span>Ran: {item.ran[0]}. </span> : null}
      <span className="evidence-line-caveat">{item.caveat}</span>
    </p>
  );
}
