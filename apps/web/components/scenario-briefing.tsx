import type { Game, ScenarioDefinition } from "@wargame/shared";

type ScenarioBriefingProps = {
  game: Game;
  scenario: ScenarioDefinition;
};

export function ScenarioBriefing({ game, scenario }: ScenarioBriefingProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Scenario Briefing</h2>
        <span className="muted">
          Turn {game.turnNumber} · {game.phase.replaceAll("_", " ")}
        </span>
      </div>
      <p className="highlight">{game.publicState.headline}</p>
      <p>{game.publicState.publicNarrative}</p>
      <div className="inline-meta">
        <span className="pill">{scenario.title}</span>
        <span className="pill">{scenario.historicalFrame}</span>
      </div>
    </section>
  );
}
