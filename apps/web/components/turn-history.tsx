import type { TurnResolution } from "@wargame/shared";

type TurnHistoryProps = {
  turns: TurnResolution[];
};

export function TurnHistory({ turns }: TurnHistoryProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Turn History</h2>
        <span className="muted">{turns.length} resolved turns</span>
      </div>
      <ul className="history-list">
        {turns.map((turn) => (
          <li className="history-item" key={turn.id}>
            <div className="panel__header">
              <strong>Turn {turn.turnNumber}</strong>
              <span className="pill">{turn.status}</span>
            </div>
            <p>{turn.publicSummary}</p>
            <p className="muted">{turn.llmNarrative.headline}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
