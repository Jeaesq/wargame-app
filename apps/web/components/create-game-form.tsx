"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioDefinition } from "@wargame/shared";
import { createGameAction, type FormActionState } from "../app/games/new/actions";

const initialState: FormActionState = {};

type CreateGameFormProps = {
  scenarios: ScenarioDefinition[];
};

export function CreateGameForm({ scenarios }: CreateGameFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createGameAction, initialState);
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0]?.id ?? "");
  const [selectedFactionId, setSelectedFactionId] = useState(
    scenarios[0]?.factions[0]?.id ?? ""
  );
  const scenario =
    scenarios.find((item) => item.id === selectedScenarioId) ?? scenarios[0] ?? null;

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  useEffect(() => {
    if (!scenario) {
      return;
    }

    const stillValid = scenario.factions.some((faction) => faction.id === selectedFactionId);

    if (!stillValid) {
      setSelectedFactionId(scenario.factions[0]?.id ?? "");
    }
  }, [scenario, selectedFactionId]);

  return (
    <form action={formAction} className="panel form-card">
      <div className="form-grid">
        <label className="field">
          <span>Player name</span>
          <input defaultValue="Player One" name="playerName" />
        </label>
        <label className="field">
          <span>Scenario</span>
          <select
            name="scenarioId"
            value={scenario?.id ?? ""}
            onChange={(event) => setSelectedScenarioId(event.target.value)}
          >
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
          <select
            key={scenario?.id ?? "scenario-none"}
            name="factionId"
            value={selectedFactionId}
            onChange={(event) => setSelectedFactionId(event.target.value)}
          >
            {(scenario?.factions ?? []).map((faction) => (
              <option key={faction.id} value={faction.id}>
                {faction.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Target Game Length</span>
          <select defaultValue="medium" name="targetGameLength">
            <option value="short">Short (~10 turns)</option>
            <option value="medium">Medium (~20 turns)</option>
            <option value="long">Long (~30 turns)</option>
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
