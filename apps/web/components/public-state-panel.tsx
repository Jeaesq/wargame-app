import type { Game } from "@wargame/shared";

type PublicStatePanelProps = {
  game: Game;
};

export function PublicStatePanel({ game }: PublicStatePanelProps) {
  const visibleTracks = Object.entries(game.state.public.visibleTracks);

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Public State</h2>
        <span className="pill">World tension {game.state.public.worldTension}%</span>
      </div>
      <div className="stats-grid">
        {visibleTracks.map(([label, value]) => (
          <div className="kpi" key={label}>
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="subtle-divider" />
      <div className="inline-meta">
        {game.state.public.publicFlags.map((flag) => (
          <span className="pill" key={flag}>
            {flag}
          </span>
        ))}
      </div>
    </section>
  );
}
