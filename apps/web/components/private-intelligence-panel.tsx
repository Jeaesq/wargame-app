import type { PrivatePlayerState, TurnResolution } from "@wargame/shared";

type PrivateIntelligencePanelProps = {
  privateState: PrivatePlayerState | null;
  lastResolution?: TurnResolution | null;
};

export function PrivateIntelligencePanel({
  privateState,
  lastResolution
}: PrivateIntelligencePanelProps) {
  if (!privateState) {
    return (
      <section className="panel">
        <h2>Private Intelligence</h2>
        <p className="muted">No private intelligence is available for this view yet.</p>
      </section>
    );
  }

  const recentUpdates = lastResolution?.privateSummaries.map((summary) => summary.summary) ?? [];

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Private Intelligence</h2>
        <span className="pill">{privateState.factionId}</span>
      </div>
      <p className="highlight">{privateState.privateBriefing}</p>
      {recentUpdates.length ? (
        <>
          <h3>Latest update</h3>
          <ul className="list">
            {recentUpdates.map((item) => (
              <li className="list-item" key={item}>
                {item}
              </li>
            ))}
          </ul>
          <div className="subtle-divider" />
        </>
      ) : null}
      <h3>Standing intelligence</h3>
      <ul className="list">
        {privateState.intelligence.map((item) => (
          <li className="list-item" key={item}>
            {item}
          </li>
        ))}
      </ul>
      <div className="subtle-divider" />
      <div className="inline-meta">
        {privateState.secretFlags.map((flag) => (
          <span className="pill" key={flag}>
            {flag}
          </span>
        ))}
      </div>
    </section>
  );
}
