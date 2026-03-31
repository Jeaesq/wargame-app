import type { Game, ScenarioDefinition } from "@wargame/shared";

type ScenarioBriefingProps = {
  game: Game;
  scenario: ScenarioDefinition;
};

export function ScenarioBriefing({ game, scenario }: ScenarioBriefingProps) {
  const publicObjectives = scenario.objectives.filter(
    (objective) => objective.visibility === "public"
  );

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Scenario Briefing</h2>
        <span className="muted">
          Turn {game.turnNumber} · {game.phase.replaceAll("_", " ")}
        </span>
      </div>
      <p className="highlight">{game.state.public.headline}</p>
      <p>{game.state.public.publicNarrative}</p>
      <div className="inline-meta">
        <span className="pill">{scenario.title}</span>
        <span className="pill">{scenario.historicalFrame}</span>
      </div>
      {publicObjectives.length ? (
        <>
          <div className="subtle-divider" />
          <h3>Faction Objectives</h3>
          <ul className="list">
            {publicObjectives.map((objective) => {
              const factionName =
                game.factions.find((faction) => faction.id === objective.factionId)?.name ??
                objective.factionId;

              return (
                <li className="list-item" key={objective.id}>
                  <strong>{factionName}:</strong> {objective.summary}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}
