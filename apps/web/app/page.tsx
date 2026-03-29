import Link from "next/link";
import { appManifest } from "@wargame/shared";
import { PageHeader } from "../components/page-header";
import { getGames, getScenarios } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [scenarios, games] = await Promise.all([getScenarios(), getGames()]);
  const leadScenario = scenarios[0];
  const latestGame = games[games.length - 1];

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
              {latestGame ? (
                <Link className="button button--secondary" href={`/games/${latestGame.id}`}>
                  Open latest session
                </Link>
              ) : null}
            </>
          }
        />
        <section className="stats-grid">
          <article className="panel">
            <p className="eyebrow">Scenario Track</p>
            <h2>{leadScenario?.title ?? "No scenarios loaded"}</h2>
            <p className="muted">
              {leadScenario?.description ?? "Start the API to load scenario data."}
            </p>
          </article>
          <article className="panel">
            <p className="eyebrow">Active Sessions</p>
            <h2>{games.length}</h2>
            <p className="muted">
              {latestGame
                ? `Most recent game is on turn ${latestGame.turnNumber}.`
                : "No in-memory games created yet."}
            </p>
          </article>
          <article className="panel">
            <p className="eyebrow">Interface Goal</p>
            <h2>Clear, playable, bounded</h2>
            <p className="muted">
              The frontend now reads and mutates game state through the backend API.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
