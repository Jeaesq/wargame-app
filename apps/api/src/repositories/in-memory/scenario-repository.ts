import {
  scenarioDefinitionSchema,
  type ScenarioDefinition
} from "@wargame/shared";
import type { ScenarioRepository } from "../contracts.js";
import type { InMemoryStore } from "./store.js";

export class InMemoryScenarioRepository implements ScenarioRepository {
  constructor(store: InMemoryStore, initialScenarios: ScenarioDefinition[]) {
    for (const scenario of initialScenarios) {
      store.scenarios.set(scenario.id, scenarioDefinitionSchema.parse(scenario));
    }

    this.store = store;
  }

  private readonly store: InMemoryStore;

  async listScenarios(): Promise<ScenarioDefinition[]> {
    return Array.from(this.store.scenarios.values()).map((scenario) =>
      scenarioDefinitionSchema.parse(scenario)
    );
  }

  async getScenarioById(scenarioId: string): Promise<ScenarioDefinition | null> {
    const scenario = this.store.scenarios.get(scenarioId);
    return scenario ? scenarioDefinitionSchema.parse(scenario) : null;
  }
}
