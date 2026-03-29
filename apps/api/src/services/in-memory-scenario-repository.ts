import { scenarioDefinitionSchema, type ScenarioDefinition } from "@wargame/shared";
import type { ScenarioRepository } from "./types.js";

export class InMemoryScenarioRepository implements ScenarioRepository {
  private readonly scenarios = new Map<string, ScenarioDefinition>();

  constructor(initialScenarios: ScenarioDefinition[]) {
    for (const scenario of initialScenarios) {
      this.scenarios.set(scenario.id, scenarioDefinitionSchema.parse(scenario));
    }
  }

  async listScenarios(): Promise<ScenarioDefinition[]> {
    return Array.from(this.scenarios.values()).map((scenario) =>
      scenarioDefinitionSchema.parse(scenario)
    );
  }

  async getScenarioById(scenarioId: string): Promise<ScenarioDefinition | null> {
    const scenario = this.scenarios.get(scenarioId);
    return scenario ? scenarioDefinitionSchema.parse(scenario) : null;
  }
}
