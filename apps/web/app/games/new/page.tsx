import Link from "next/link";
import { PageHeader } from "../../../components/page-header";
import { mockScenario } from "../../../lib/mock-data";

export default function NewGamePage() {
  return (
    <main className="page">
      <div className="section-stack">
        <PageHeader
          eyebrow="New Game"
          title="Create a new crisis session"
          description="This is a placeholder setup screen for the first Cold War scenario. It is intentionally static for now, but structured like a future real creation flow."
        />
        <section className="panel form-card">
          <div className="form-grid">
            <label className="field">
              <span>Scenario</span>
              <select defaultValue={mockScenario.id}>
                <option value={mockScenario.id}>{mockScenario.title}</option>
              </select>
            </label>
            <label className="field">
              <span>Mode</span>
              <select defaultValue="solo">
                <option value="solo">Solo</option>
                <option value="head_to_head">Head to head</option>
              </select>
            </label>
            <label className="field">
              <span>Player faction</span>
              <select defaultValue="faction-usa">
                <option value="faction-usa">United States Bloc</option>
                <option value="faction-ussr">Soviet Bloc</option>
              </select>
            </label>
          </div>
          <div className="subtle-divider" />
          <div className="split">
            <div>
              <h2>{mockScenario.title}</h2>
              <p>{mockScenario.historicalFrame}</p>
            </div>
            <div>
              <p className="muted">MVP assumptions</p>
              <ul className="list">
                <li className="list-item">One historical-inspired crisis</li>
                <li className="list-item">Backend-owned turn resolution</li>
                <li className="list-item">Private intelligence by faction</li>
              </ul>
            </div>
          </div>
          <div className="hero__actions">
            <Link className="button" href="/games/mock-game-1">
              Launch mock game
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
