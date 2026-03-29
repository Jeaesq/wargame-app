import type { TurnResolution } from "@wargame/shared";

type TurnHistoryProps = {
  turns: TurnResolution[];
};

export function TurnHistory({ turns }: TurnHistoryProps) {
  const chronologicalTurns = [...turns].sort(
    (left, right) => left.turnNumber - right.turnNumber
  );

  return (
    <section className="panel history-panel">
      <div className="panel__header">
        <h2>Turn History</h2>
        <span className="muted">{turns.length} resolved turns</span>
      </div>
      <ul className="history-list">
        {chronologicalTurns.map((turn) => (
          <li className="history-item" key={turn.id}>
            <div className="panel__header">
              <strong>Turn {turn.turnNumber}</strong>
              <span className="pill">{turn.status}</span>
            </div>
            <div className="inline-meta">
              <span className={`pill ${turn.actor.playerRole === "ai" ? "pill--risk" : ""}`}>
                {turn.actor.playerRole === "ai" ? "Bot Move" : "Player Move"}
              </span>
              <span className="pill">
                {turn.actor.playerName} · {turn.actor.factionId}
              </span>
              <span className="pill">
                Action: {turn.selectedAction.title}
              </span>
              <span className="pill">
                Type: {turn.selectedAction.kind.replaceAll("_", " ")}
              </span>
              {turn.selectedAction.recommendationPercent !== null ? (
                <span className="pill">
                  Advisory: {turn.selectedAction.recommendationPercent}%
                </span>
              ) : null}
            </div>
            <p className="highlight">{turn.llmNarrative.headline}</p>
            <p>{turn.publicSummary}</p>
            <p className="muted">{turn.llmNarrative.publicSummary}</p>
            <div className="history-grid">
              <div>
                <h3>State Changes</h3>
                <ul className="list">
                  {turn.stateChanges.map((change) => (
                    <li className="list-item" key={`${turn.id}-${change.key}`}>
                      {change.label}: {change.previousValue ?? "n/a"} to {change.newValue}
                      {" "}({change.delta >= 0 ? "+" : ""}
                      {change.delta})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Labels</h3>
                <div className="inline-meta">
                  {turn.recommendationLabels.map((label) => (
                    <span className="pill" key={`${turn.id}-${label}`}>
                      {label}
                    </span>
                  ))}
                  {turn.riskLabels.map((label) => (
                    <span className="pill pill--risk" key={`${turn.id}-${label}`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
