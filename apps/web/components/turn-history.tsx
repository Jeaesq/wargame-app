import type { TurnResolution } from "@wargame/shared";

type TurnHistoryProps = {
  turns: TurnResolution[];
};

export function TurnHistory({ turns }: TurnHistoryProps) {
  const reverseChronologicalTurns = [...turns].sort(
    (left, right) => right.turnNumber - left.turnNumber
  );

  function formatSignedDelta(value: number) {
    return `${value >= 0 ? "+" : ""}${value}`;
  }

  return (
    <section className="panel history-panel">
      <div className="panel__header">
        <h2>Turn History</h2>
        <span className="muted">{turns.length} resolved turns</span>
      </div>
      <ul className="history-list">
        {reverseChronologicalTurns.map((turn) => (
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
            <div className="split">
              <div>
                <h3>Public developments</h3>
                <p>{turn.publicSummary}</p>
              </div>
              <div>
                <h3>Why it changed</h3>
                <p className="muted">{turn.llmNarrative.publicSummary}</p>
              </div>
            </div>
            {turn.sessionOutcome?.status === "ended" ? (
              <>
                <p className="highlight">{turn.sessionOutcome.title}</p>
                <p>{turn.sessionOutcome.summary}</p>
              </>
            ) : null}
            <div className="history-grid">
              <div>
                <h3>Key shifts</h3>
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
                <h3>Risk and posture</h3>
                {turn.stateChanges.some((change) => change.key === "escalationRiskPercent") ? (
                  <p className="muted">
                    {(() => {
                      const riskChange = turn.stateChanges.find(
                        (change) => change.key === "escalationRiskPercent"
                      );

                      return riskChange
                        ? `Escalation risk moved ${formatSignedDelta(riskChange.delta)} to ${riskChange.newValue}.`
                        : "";
                    })()}
                  </p>
                ) : null}
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
                {turn.effects.length ? (
                  <>
                    <div className="subtle-divider" />
                    <h3>Effects</h3>
                    <ul className="list">
                      {turn.effects.slice(0, 3).map((effect) => (
                        <li className="list-item" key={`${turn.id}-${effect}`}>
                          {effect}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
