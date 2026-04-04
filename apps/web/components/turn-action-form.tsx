"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@wargame/shared";
import { submitTurnAction, type TurnFormActionState } from "../app/games/[gameId]/turn/actions";

const initialState: TurnFormActionState = {};

type TurnActionFormProps = {
  game: Game;
};

export function TurnActionForm({ game }: TurnActionFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitTurnAction, initialState);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const actingPlayer =
    game.players.find(
      (player) => player.role === "human" && player.factionId === game.currentFactionId
    ) ?? game.players.find((player) => player.role === "human");
  const privateState = game.state.privateByPlayer.find(
    (state) => state.playerId === actingPlayer?.id
  );
  const selectedOption = useMemo(
    () =>
      privateState?.availableOptions.find((option) => option.id === selectedOptionId) ?? null,
    [privateState?.availableOptions, selectedOptionId]
  );
  const isSoloRound = game.mode === "solo" && game.progression.model === "solo_round";

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

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
      {isSoloRound ? (
        <p className="muted">
          This choice resolves your visible step for the current round. The AI follow-up will then
          resolve the opposing move before the next round begins.
        </p>
      ) : null}
      {game.status === "completed" || game.state.derived.outcome.status === "ended" ? (
        <>
          <p className="highlight">
            {game.state.derived.outcome.title ?? "This session has reached an end state."}
          </p>
          <p className="muted">
            {game.state.derived.outcome.summary ??
              "Review the session overview and turn history for the final result."}
          </p>
        </>
      ) : null}
      <form action={formAction} className="section-stack">
        <input name="gameId" type="hidden" value={game.id} />
        <input name="playerId" type="hidden" value={actingPlayer.id} />
        <input name="factionId" type="hidden" value={actingPlayer.factionId} />
        <input name="optionId" type="hidden" value={selectedOptionId} />
        <div className="section-stack">
          {(privateState?.availableOptions ?? []).map((option) => (
            <button
              className={`option-card option-button ${
                selectedOptionId === option.id ? "option-button--selected" : ""
              }`}
              disabled={
                pending || game.status === "completed" || game.state.derived.outcome.status === "ended"
              }
              key={option.id}
              onClick={() => setSelectedOptionId(option.id)}
              type="button"
            >
              <div className="panel__header">
                <strong>{option.title}</strong>
                <span className="pill">{option.recommendationPercent ?? "n/a"}%</span>
              </div>
              <span>{option.summary}</span>
              <span className="muted">
                {typeof option.metadata.presentationCategory === "string"
                  ? option.metadata.presentationCategory
                  : option.kind.replaceAll("_", " ")}
              </span>
            </button>
          ))}
        </div>
        {selectedOption ? (
          <div className="selection-summary">
            <strong>Selected option</strong>
            <p>{selectedOption.title}</p>
            <p className="muted">{selectedOption.summary}</p>
            {selectedOption.detail ? <p className="muted">{selectedOption.detail}</p> : null}
            <div className="inline-meta">
              <span className="pill">
                Advisory: {selectedOption.recommendationPercent ?? "n/a"}%
              </span>
              {selectedOption.requirementTags.length ? (
                <span className="pill">
                  Requirements: {selectedOption.requirementTags.join(", ")}
                </span>
              ) : null}
            </div>
            {selectedOption.consequenceHints.length ? (
              <p className="muted">
                Visible tradeoffs: {selectedOption.consequenceHints.slice(0, 3).join(" · ")}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="muted">Select one option before confirming your turn.</p>
        )}
        <div className="hero__actions">
          <button
            className="button"
            disabled={
              pending ||
              !selectedOption ||
              game.status === "completed" ||
              game.state.derived.outcome.status === "ended"
            }
            type="submit"
          >
            {pending
              ? "Submitting..."
              : game.status === "completed" || game.state.derived.outcome.status === "ended"
                ? "Session complete"
              : selectedOption
                ? isSoloRound
                  ? "Commit player move and resolve round"
                  : "Confirm and submit action"
                : "Select an option first"}
          </button>
        </div>
        {!privateState?.availableOptions.length ? (
          <p className="muted">No private action options are available for this player right now.</p>
        ) : null}
        {state.error ? <p className="form-error">{state.error}</p> : null}
      </form>
    </section>
  );
}
