import assert from "node:assert/strict";
import test from "node:test";
import type { ChoiceOption, ScenarioDefinition } from "@wargame/shared";
import { evaluateSessionOutcome } from "./session-outcome-service.js";

const scenario: ScenarioDefinition = {
  id: "scenario-cold-war-berlin-mvp",
  slug: "cold-war-berlin-mvp",
  title: "Berlin Crisis MVP",
  description: "Cold War crisis.",
  historicalFrame: "Berlin confrontation.",
  complexity: "introductory",
  supportedModes: ["solo", "head_to_head"],
  maxPlayers: 2,
  startingTurn: 1,
  objectives: [
    {
      id: "objective-usa",
      factionId: "faction-usa",
      title: "Hold access",
      summary: "Keep Berlin viable without losing control of escalation.",
      successSignals: [],
      failureSignals: [],
      visibility: "public",
      metadata: {}
    },
    {
      id: "objective-ussr",
      factionId: "faction-ussr",
      title: "Force concessions",
      summary: "Press for leverage without tipping into open war.",
      successSignals: [],
      failureSignals: [],
      visibility: "public",
      metadata: {}
    }
  ],
  factions: [
    {
      id: "faction-usa",
      scenarioId: "scenario-cold-war-berlin-mvp",
      slug: "usa",
      name: "United States Bloc",
      role: "major_power",
      description: "Western coalition.",
      doctrineSummary: "Signal resolve and manage escalation.",
      publicTraits: [],
      privateTraits: [],
      isPlayable: true,
      metadata: {}
    },
    {
      id: "faction-ussr",
      scenarioId: "scenario-cold-war-berlin-mvp",
      slug: "ussr",
      name: "Soviet Bloc",
      role: "major_power",
      description: "Eastern bloc leadership.",
      doctrineSummary: "Apply pressure without losing control.",
      publicTraits: [],
      privateTraits: [],
      isPlayable: true,
      metadata: {}
    }
  ],
  openingState: {
    publicState: {
      scenarioId: "scenario-cold-war-berlin-mvp",
      turnNumber: 1,
      activeFactionId: "faction-usa",
      phase: "briefing",
      worldTension: 45,
      publicNarrative: "Opening confrontation.",
      headline: "Berlin pressure rises",
      visibleTracks: {},
      publicFlags: [],
      revealedEvents: [],
      metadata: {}
    },
    privateStates: [],
    derivedState: {
      escalationRiskPercent: 30,
      negotiationLeverage: {},
      factionMomentum: {},
      outcome: {
        status: "ongoing",
        category: null,
        title: null,
        summary: null,
        winningFactionId: null,
        achievedAtTurn: null,
        pressure: {
          maturityPercent: 0,
          decisiveOutcomePercent: 0,
          deescalationOpportunityPercent: 0,
          catastrophicRiskPercent: 0
        },
        publicObjectiveProgress: {},
        metadata: {}
      },
      warnings: [],
      metadata: {}
    },
    initialOptions: []
  },
  choiceCatalog: [],
  metadata: {}
};

const selectedOption: ChoiceOption = {
  id: "option-usa-airlift",
  scenarioId: scenario.id,
  factionId: "faction-usa",
  kind: "military_signal",
  title: "Expand airlift",
  summary: "Signal resolve.",
  visibility: "public",
  requirementTags: [],
  consequenceHints: [],
  recommendationPercent: 70,
  effectProfile: {
    worldTensionDelta: 8,
    escalationRiskDelta: 6,
    visibleTrackDeltas: {},
    negotiationLeverageDeltas: {},
    factionMomentumDeltas: {},
    publicFlagAdds: [],
    publicFlagRemoves: [],
    revealedEventAdds: [],
    warningAdds: []
  },
  metadata: {}
};

test("session outcome stays ongoing early in a balanced scenario", () => {
  const outcome = evaluateSessionOutcome({
    scenario,
    targetGameLength: "medium",
    turnNumber: 2,
    worldTension: 53,
    escalationRiskPercent: 42,
    visibleTracks: {
      diplomaticPressure: 56,
      militaryPosture: 44,
      globalAttention: 59
    },
    negotiationLeverage: {
      "faction-usa": 55,
      "faction-ussr": 52
    },
    factionMomentum: {
      "faction-usa": 54,
      "faction-ussr": 51
    },
    selectedOption
  });

  assert.equal(outcome.status, "ongoing");
  assert.equal(outcome.category, null);
  assert.equal(outcome.pressure.maturityPercent > 0, true);
});

test("session outcome reaches catastrophic escalation when pressure becomes extreme", () => {
  const outcome = evaluateSessionOutcome({
    scenario,
    targetGameLength: "medium",
    turnNumber: 8,
    worldTension: 97,
    escalationRiskPercent: 91,
    visibleTracks: {
      diplomaticPressure: 86,
      militaryPosture: 94,
      globalAttention: 88
    },
    negotiationLeverage: {
      "faction-usa": 49,
      "faction-ussr": 60
    },
    factionMomentum: {
      "faction-usa": 43,
      "faction-ussr": 72
    },
    selectedOption
  });

  assert.equal(outcome.status, "ended");
  assert.equal(outcome.category, "catastrophic_escalation");
  assert.equal(outcome.winningFactionId, null);
});
