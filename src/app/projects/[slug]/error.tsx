"use client";
import Link from "next/link";
export default function WorldError({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="not-found container">
      <span className="eyebrow">WORLD TEMPORARILY UNAVAILABLE</span>
      <h1 tabIndex={-1}>Let’s try that again.</h1>
      <p>
        The project could not finish loading. Your browser navigation still
        works.
      </p>
      <div className="module-actions">
        <button className="button button-lime" onClick={reset}>
          Retry world
        </button>
        <Link className="button button-outline" href="/#projects">
          Back to Multiverse
        </Link>
      </div>
    </main>
  );
}
