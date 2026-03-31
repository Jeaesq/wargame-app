import type { ScenarioDefinition } from "@wargame/shared";
import { createColdWarMvpScenarioDefinition } from "./cold-war-mvp.js";
import { createSuezMvpScenarioDefinition } from "./suez-mvp.js";

export function getScenarioDefinitions(): ScenarioDefinition[] {
  return [
    createColdWarMvpScenarioDefinition(),
    createSuezMvpScenarioDefinition()
  ];
}
