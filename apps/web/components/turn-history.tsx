import type { TurnResolution } from "@wargame/shared";

type TurnHistoryProps = {
  turns: TurnResolution[];
};

export function TurnHistory({ turns }: TurnHistoryProps) {
  const reverseChronologicalTurns = [...turns].sort(
    (left, right) =>
      right.progression.roundNumber - left.progression.roundNumber ||
      right.progression.roundActionIndex - left.progression.roundActionIndex ||
      right.turnNumber - left.turnNumber
  );
  const groupedTurns = reverseChronologicalTurns.reduce<
    Array<{
      key: string;
      turnNumber: number;
      roundNumber: number;
      roundActionCount: number;
      turns: TurnResolution[];
    }>
  >((groups, turn) => {
    const key = `${turn.turnNumber}-${turn.progression.roundNumber}`;
    const lastGroup = groups.at(-1);

    if (lastGroup?.key === key) {
      lastGroup.turns.push(turn);
      return groups;
    }

    groups.push({
      key,
      turnNumber: turn.turnNumber,
      roundNumber: turn.progression.roundNumber,
      roundActionCount: turn.progression.roundActionCount,
      turns: [turn]
    });

    return groups;
  }, []);

  function formatSignedDelta(value: number) {
    return `${value >= 0 ? "+" : ""}${value}`;
  }

  return (
    <section className="panel history-panel">
      <div className="panel__header">
        <h2>Turn History</h2>
        <span className="muted">
          {groupedTurns.length} round{groupedTurns.length === 1 ? "" : "s"} · {turns.length} resolved
          {" "}actions
        </span>
      </div>
      <ul className="history-list">
        {groupedTurns.map((group) => {
          const latestTurn = group.turns[0]!;
          const endedTurn = group.turns.find((turn) => turn.sessionOutcome?.status === "ended") ?? null;

          return (
            <li className="history-item history-item--grouped" key={group.key}>
              <div className="panel__header">
                <strong>
                  Round {group.roundNumber}
                  {group.roundActionCount > 1 ? ` · ${group.turns.length}/${group.roundActionCount} actions shown` : ""}
                </strong>
                <span className="pill">{latestTurn.status}</span>
              </div>
              <p className="highlight">
                {group.turns.length > 1
                  ? `This round records the player action and AI follow-up as one visible exchange.`
                  : `This round currently has one recorded visible action.`}
              </p>
              <div className="history-round-steps">
                {group.turns
                  .slice()
                  .sort((left, right) => left.progression.roundActionIndex - right.progression.roundActionIndex)
                  .map((turn) => (
                    <article className="history-step-card" key={turn.id}>
                      <div className="panel__header">
                        <strong>
                          {turn.actor.playerRole === "ai" ? "AI follow-up" : "Player action"}
                          {turn.progression.roundActionCount > 1
                            ? ` · Step ${turn.progression.roundActionIndex}/${turn.progression.roundActionCount}`
                            : ""}
                        </strong>
                        <span className={`pill ${turn.actor.playerRole === "ai" ? "pill--risk" : ""}`}>
                          {turn.actor.playerName}
                        </span>
                      </div>
                      <div className="inline-meta">
                        <span className="pill">{turn.actor.factionId}</span>
                        <span className="pill">Action: {turn.selectedAction.title}</span>
                        <span className="pill">
                          Type: {turn.selectedAction.kind.replaceAll("_", " ")}
                        </span>
                        {turn.selectedAction.recommendationPercent !== null ? (
                          <span className="pill">
                            Advisory: {turn.selectedAction.recommendationPercent}%
                          </span>
                        ) : null}
                      </div>
                      <p>{turn.publicSummary}</p>
                      <p className="muted">{turn.llmNarrative.publicSummary}</p>
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
                    </article>
                  ))}
              </div>
              <div className="history-grid">
                <div>
                  <h3>Round-level shifts</h3>
                  <ul className="list">
                    {latestTurn.stateChanges.map((change) => (
                      <li className="list-item" key={`${latestTurn.id}-${change.key}`}>
                        {change.label}: {change.previousValue ?? "n/a"} to {change.newValue} (
                        {formatSignedDelta(change.delta)})
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Visible consequences</h3>
                  {latestTurn.stateChanges.some((change) => change.key === "escalationRiskPercent") ? (
                    <p className="muted">
                      {(() => {
                        const riskChange = latestTurn.stateChanges.find(
                          (change) => change.key === "escalationRiskPercent"
                        );

                        return riskChange
                          ? `Escalation risk moved ${formatSignedDelta(riskChange.delta)} to ${riskChange.newValue} by the end of this round.`
                          : "";
                      })()}
                    </p>
                  ) : null}
                  {latestTurn.effects.length ? (
                    <ul className="list">
                      {latestTurn.effects.slice(0, 3).map((effect) => (
                        <li className="list-item" key={`${latestTurn.id}-${effect}`}>
                          {effect}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No additional round-level effects were recorded.</p>
                  )}
                </div>
              </div>
              {endedTurn?.sessionOutcome?.status === "ended" ? (
                <>
                  <div className="subtle-divider" />
                  <p className="highlight">{endedTurn.sessionOutcome.title}</p>
                  <p>{endedTurn.sessionOutcome.summary}</p>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
