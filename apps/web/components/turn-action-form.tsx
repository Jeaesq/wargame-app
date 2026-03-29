"use client";

import { useActionState } from "react";
import type { Game } from "@wargame/shared";
import { submitTurnAction, type TurnFormActionState } from "../app/games/[gameId]/turn/actions";

const initialState: TurnFormActionState = {};

type TurnActionFormProps = {
  game: Game;
};

export function TurnActionForm({ game }: TurnActionFormProps) {
  const [state, formAction, pending] = useActionState(submitTurnAction, initialState);
  const actingPlayer =
    game.players.find(
      (player) => player.role === "human" && player.factionId === game.currentFactionId
    ) ?? game.players.find((player) => player.role === "human");

  if (!actingPlayer || !actingPlayer.factionId) {
    return (
      <section className="panel">
        <h2>Submit Action</h2>
        <p className="muted">No human-controlled acting player is available for this turn.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Submit Action</h2>
        <span className="pill">
          {actingPlayer.name} · {actingPlayer.factionId}
        </span>
      </div>
      <form action={formAction} className="section-stack">
        <input name="gameId" type="hidden" value={game.id} />
        <input name="playerId" type="hidden" value={actingPlayer.id} />
        <input name="factionId" type="hidden" value={actingPlayer.factionId} />
        <div className="section-stack">
          {game.availableOptions.map((option) => (
            <button
              className="option-card option-button"
              disabled={pending}
              key={option.id}
              name="optionId"
              type="submit"
              value={option.id}
            >
              <div className="panel__header">
                <strong>{option.title}</strong>
                <span className="pill">{option.recommendationPercent ?? "n/a"}%</span>
              </div>
              <span>{option.summary}</span>
              <span className="muted">{option.kind.replaceAll("_", " ")}</span>
            </button>
          ))}
        </div>
        {state.error ? <p className="form-error">{state.error}</p> : null}
      </form>
    </section>
  );
}
