"use client";

import { useActionState } from "react";
import {
  askAdvisorAction,
  type AdvisorFormState
} from "../app/games/[gameId]/advisor/actions";

const initialState: AdvisorFormState = {};

type AdvisorQuestionFormProps = {
  gameId: string;
  playerId?: string;
  factionId?: string | null;
};

export function AdvisorQuestionForm({
  gameId,
  playerId,
  factionId
}: AdvisorQuestionFormProps) {
  const [state, formAction, pending] = useActionState(
    askAdvisorAction,
    initialState
  );

  return (
    <form action={formAction} className="advisor-form">
      <input name="gameId" type="hidden" value={gameId} />
      <input name="playerId" type="hidden" value={playerId ?? ""} />
      <input name="factionId" type="hidden" value={factionId ?? ""} />
      <label className="field">
        <span>Ask the advisor</span>
        <textarea
          defaultValue="Which visible option best fits this round, and what is the main tradeoff?"
          name="question"
          rows={3}
        />
      </label>
      <p className="muted">
        Good prompts: "What matters most this round?", "Which visible option best preserves the
        off-ramp?", or "What is the main risk if I choose this move?"
      </p>
      <div className="hero__actions">
        <button className="button" disabled={pending} type="submit">
          {pending ? "Asking..." : "Submit question"}
        </button>
      </div>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.answerText ? <p className="muted">Latest reply: {state.answerText}</p> : null}
    </form>
  );
}
