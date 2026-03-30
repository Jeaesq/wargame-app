import Link from "next/link";
import type { Game } from "@wargame/shared";
import {
  buildFactionViewHref,
  getControlledPlayers,
  getCurrentUserIdentity,
  getFactionName
} from "../lib/session-access";

type SessionAccessPanelProps = {
  game: Game;
  pathname: string;
  selectedPlayerId?: string | null;
};

export function SessionAccessPanel({
  game,
  pathname,
  selectedPlayerId
}: SessionAccessPanelProps) {
  const identity = getCurrentUserIdentity();
  const controlledPlayers = getControlledPlayers(game);
  const owner = game.ownerUserId === identity.userId;
  const selectedPlayer =
    controlledPlayers.find((player) => player.id === selectedPlayerId) ??
    controlledPlayers[0] ??
    null;

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Session Access</h2>
        <span className="pill">{owner ? "Owner" : "Participant"}</span>
      </div>
      <div className="inline-meta">
        <span className="pill">User: {identity.displayName}</span>
        <span className="pill">Owner id: {game.ownerUserId}</span>
        <span className="pill">
          Current view: {getFactionName(game, selectedPlayer?.factionId)}
        </span>
      </div>
      <p className="muted">
        This is lightweight multiplayer scaffolding: the same session can later be opened from
        different faction perspectives.
      </p>
      {controlledPlayers.length > 0 ? (
        <div className="inline-meta">
          {controlledPlayers.map((player) => {
            const href = buildFactionViewHref({
              pathname,
              playerId: player.id,
              factionId: player.factionId
            });
            const selected = player.id === selectedPlayer?.id;

            return (
              <Link
                className={`pill ${selected ? "" : "pill--risk"}`}
                href={href}
                key={player.id}
              >
                {selected ? "Viewing" : "Open as"} {getFactionName(game, player.factionId)}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="muted">No controlled faction is attached to this development identity yet.</p>
      )}
    </section>
  );
}
