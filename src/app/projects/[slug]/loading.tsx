export default function Loading() {
  return (
    <main id="main" className="world-loading container" aria-busy="true">
      <span className="eyebrow">OPENING A NEW DIMENSION</span>
      <h1 tabIndex={-1}>Assembling the world.</h1>
      <div className="world-loading-grid" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <p>
        The project overview stays available as the interactive modules load.
      </p>
    </main>
  );
}
