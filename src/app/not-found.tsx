import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="not-found container">
      <span className="eyebrow">404 / UNCHARTED SPACE</span>
      <h1 tabIndex={-1}>
        This world
        <br />
        isn’t mapped yet.
      </h1>
      <p>Return to the multiverse to explore a verified project.</p>
      <Link className="button button-lime" href="/#projects">
        Back to Multiverse →
      </Link>
    </main>
  );
}
