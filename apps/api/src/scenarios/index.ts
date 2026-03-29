import type { ScenarioDefinition } from "@wargame/shared";
import { createColdWarMvpScenarioDefinition } from "./cold-war-mvp.js";

export function getScenarioDefinitions(): ScenarioDefinition[] {
  return [createColdWarMvpScenarioDefinition()];
}
