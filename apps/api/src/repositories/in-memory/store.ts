import type { Game, ScenarioDefinition, TurnResolution } from "@wargame/shared";

export class InMemoryStore {
  // TODO: Replace this shared process-local store with database-backed repositories.
  readonly sessions = new Map<string, Game>();
  readonly turnsBySession = new Map<string, TurnResolution[]>();
  readonly scenarios = new Map<string, ScenarioDefinition>();
}
