import type { Game } from "@wargame/shared";

type PublicStatePanelProps = {
  game: Game;
};

export function PublicStatePanel({ game }: PublicStatePanelProps) {
  const visibleTracks = Object.entries(game.state.public.visibleTracks);
  const revealedEvents = game.state.public.revealedEvents.slice(-4);

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Public State</h2>
        <span className="pill">World tension {game.state.public.worldTension}%</span>
      </div>
      {game.state.public.headline ? <p className="highlight">{game.state.public.headline}</p> : null}
      <div className="split">
        <div>
          <h3>Visible situation</h3>
          <p>{game.state.public.publicNarrative}</p>
        </div>
        <div>
          <h3>Active public frame</h3>
          <div className="inline-meta">
            <span className="pill">
              Phase: {game.state.public.phase.replaceAll("_", " ")}
            </span>
            <span className="pill">Active faction: {game.state.public.activeFactionId ?? "none"}</span>
          </div>
        </div>
      </div>
      <div className="stats-grid">
        {visibleTracks.length ? (
          visibleTracks.map(([label, value]) => (
            <div className="kpi" key={label}>
              <span className="muted">{label}</span>
              <strong>{value}</strong>
            </div>
          ))
        ) : (
          <div className="kpi">
            <span className="muted">Visible tracks</span>
            <strong>Stable</strong>
          </div>
        )}
      </div>
      <div className="subtle-divider" />
      <div className="split">
        <div>
          <h3>Public flags</h3>
          <div className="inline-meta">
            {game.state.public.publicFlags.length ? (
              game.state.public.publicFlags.map((flag) => (
                <span className="pill" key={flag}>
                  {flag}
                </span>
              ))
            ) : (
              <span className="muted">No public flags are active.</span>
            )}
          </div>
        </div>
        <div>
          <h3>Revealed developments</h3>
          <ul className="list">
            {revealedEvents.length ? (
              revealedEvents.map((eventId) => (
                <li className="list-item" key={eventId}>
                  {eventId}
                </li>
              ))
            ) : (
              <li className="list-item muted">No revealed developments yet.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
