import Link from "next/link";
import { appManifest } from "@wargame/shared";
import { PageHeader } from "../components/page-header";
import { mockGame, mockScenario } from "../lib/mock-data";

export default function HomePage() {
  return (
    <main className="page page--centered">
      <div className="section-stack">
        <PageHeader
          eyebrow={appManifest.name}
          title="Cold War command dashboard"
          description="A browser-based crisis simulation where the backend owns the world state and the interface surfaces turn context, private intelligence, and bounded player choices."
          actions={
            <>
              <Link className="button" href="/games/new">
                Start a new game
              </Link>
              <Link className="button button--secondary" href={`/games/${mockGame.id}`}>
                Open mock session
              </Link>
            </>
          }
        />
        <section className="stats-grid">
          <article className="panel">
            <p className="eyebrow">Scenario Track</p>
            <h2>{mockScenario.title}</h2>
            <p className="muted">{mockScenario.description}</p>
          </article>
          <article className="panel">
            <p className="eyebrow">Current Turn</p>
            <h2>Turn {mockGame.turnNumber}</h2>
            <p className="muted">
              Active faction: {mockGame.currentFactionId ?? "Unassigned"}
            </p>
          </article>
          <article className="panel">
            <p className="eyebrow">Interface Goal</p>
            <h2>Clear, playable, bounded</h2>
            <p className="muted">
              This initial frontend uses shared-type mock data and placeholder panels only.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
