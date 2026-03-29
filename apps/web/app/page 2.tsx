import { appManifest } from "@wargame/shared";

export default function HomePage() {
  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">{appManifest.name}</p>
        <h1>Geopolitical wargame monorepo scaffold</h1>
        <p className="body">
          The frontend, backend, and shared package are wired together, but no
          game logic has been implemented yet.
        </p>
        <div className="meta">
          <span>Scenario track: {appManifest.scenarioFocus}</span>
          <span>Status: foundation only</span>
        </div>
      </section>
    </main>
  );
}
