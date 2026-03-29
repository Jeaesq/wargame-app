"use client";

import { useActionState } from "react";
import type { ScenarioDefinition } from "@wargame/shared";
import { createGameAction, type FormActionState } from "../app/games/new/actions";

const initialState: FormActionState = {};

type CreateGameFormProps = {
  scenarios: ScenarioDefinition[];
};

export function CreateGameForm({ scenarios }: CreateGameFormProps) {
  const [state, formAction, pending] = useActionState(createGameAction, initialState);
  const scenario = scenarios[0];

  return (
    <form action={formAction} className="panel form-card">
      <div className="form-grid">
        <label className="field">
          <span>Player name</span>
          <input defaultValue="Player One" name="playerName" />
        </label>
        <label className="field">
          <span>Scenario</span>
          <select defaultValue={scenario?.id} name="scenarioId">
            {scenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Mode</span>
          <select defaultValue="solo" name="mode">
            <option value="solo">Solo</option>
          </select>
        </label>
        <label className="field">
          <span>Player faction</span>
          <select defaultValue={scenario?.factions[0]?.id} name="factionId">
            {(scenario?.factions ?? []).map((faction) => (
              <option key={faction.id} value={faction.id}>
                {faction.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="subtle-divider" />
      <div className="split">
        <div>
          <h2>{scenario?.title ?? "No scenario loaded"}</h2>
          <p>{scenario?.historicalFrame ?? "The backend scenario catalog is currently unavailable."}</p>
        </div>
        <div>
          <p className="muted">MVP assumptions</p>
          <ul className="list">
            <li className="list-item">In-memory backend state only</li>
            <li className="list-item">One deterministic turn resolution step</li>
            <li className="list-item">Shared-schema payload validation end to end</li>
          </ul>
        </div>
      </div>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <div className="hero__actions">
        <button className="button" disabled={pending} type="submit">
          {pending ? "Creating..." : "Create game"}
        </button>
      </div>
    </form>
  );
}
