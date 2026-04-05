import assert from "node:assert/strict";
import test from "node:test";
import type { ChoiceOption, ScenarioDefinition } from "@wargame/shared";
import { createColdWarMvpScenarioDefinition } from "../scenarios/cold-war-mvp.js";
import { createSuezMvpScenarioDefinition } from "../scenarios/suez-mvp.js";
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

const berlinScenario = createColdWarMvpScenarioDefinition();
const suezScenario = createSuezMvpScenarioDefinition();

const suezOption: ChoiceOption = {
  id: "option-coalition-ultimatum",
  scenarioId: suezScenario.id,
  factionId: "faction-anglo-french",
  kind: "diplomatic",
  title: "Issue a joint ultimatum",
  summary: "Frame intervention as a security necessity.",
  visibility: "public",
  requirementTags: [],
  consequenceHints: [],
  recommendationPercent: 60,
  effectProfile: {
    worldTensionDelta: 5,
    escalationRiskDelta: 3,
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

test("metadata-driven Berlin outcome can end in crisis de-escalation under round pacing", () => {
  const outcome = evaluateSessionOutcome({
    scenario: berlinScenario,
    targetGameLength: "medium",
    turnNumber: 4,
    worldTension: 38,
    escalationRiskPercent: 34,
    visibleTracks: {
      diplomaticPressure: 56,
      militaryPosture: 34,
      globalAttention: 59
    },
    negotiationLeverage: {
      "faction-usa": 68,
      "faction-ussr": 54
    },
    factionMomentum: {
      "faction-usa": 57,
      "faction-ussr": 49
    },
    selectedOption
  });

  assert.equal(outcome.status, "ended");
  assert.equal(outcome.category, "crisis_deescalation");
});

test("Berlin off-ramp event chain strengthens de-escalation pressure and USA progress", () => {
  const baseline = evaluateSessionOutcome({
    scenario: berlinScenario,
    targetGameLength: "medium",
    turnNumber: 4,
    worldTension: 44,
    escalationRiskPercent: 40,
    visibleTracks: {
      diplomaticPressure: 60,
      militaryPosture: 36,
      globalAttention: 68
    },
    negotiationLeverage: {
      "faction-usa": 64,
      "faction-ussr": 53
    },
    factionMomentum: {
      "faction-usa": 58,
      "faction-ussr": 48
    },
    selectedOption
  });
  const offRampVisible = evaluateSessionOutcome({
    scenario: berlinScenario,
    targetGameLength: "medium",
    turnNumber: 4,
    worldTension: 44,
    escalationRiskPercent: 40,
    visibleTracks: {
      diplomaticPressure: 60,
      militaryPosture: 36,
      globalAttention: 68
    },
    publicFlags: ["berlin-offramp-visible"],
    revealedEvents: ["berlin-airlift-offramp-emerges"],
    negotiationLeverage: {
      "faction-usa": 64,
      "faction-ussr": 53
    },
    factionMomentum: {
      "faction-usa": 58,
      "faction-ussr": 48
    },
    selectedOption
  });

  assert.ok(
    offRampVisible.pressure.deescalationOpportunityPercent >
      baseline.pressure.deescalationOpportunityPercent
  );
  assert.ok(
    (offRampVisible.publicObjectiveProgress["faction-usa"] ?? 0) >
      (baseline.publicObjectiveProgress["faction-usa"] ?? 0)
  );
});

test("Berlin checkpoint faceoff event chain raises catastrophic pressure and Soviet progress", () => {
  const baseline = evaluateSessionOutcome({
    scenario: berlinScenario,
    targetGameLength: "medium",
    turnNumber: 5,
    worldTension: 72,
    escalationRiskPercent: 69,
    visibleTracks: {
      diplomaticPressure: 70,
      militaryPosture: 72,
      globalAttention: 65
    },
    negotiationLeverage: {
      "faction-usa": 45,
      "faction-ussr": 67
    },
    factionMomentum: {
      "faction-usa": 42,
      "faction-ussr": 71
    },
    selectedOption
  });
  const faceoffActive = evaluateSessionOutcome({
    scenario: berlinScenario,
    targetGameLength: "medium",
    turnNumber: 5,
    worldTension: 72,
    escalationRiskPercent: 69,
    visibleTracks: {
      diplomaticPressure: 70,
      militaryPosture: 72,
      globalAttention: 65
    },
    publicFlags: ["checkpoint-faceoff-active"],
    revealedEvents: ["berlin-checkpoint-faceoff-intensifies"],
    negotiationLeverage: {
      "faction-usa": 45,
      "faction-ussr": 67
    },
    factionMomentum: {
      "faction-usa": 42,
      "faction-ussr": 71
    },
    selectedOption
  });

  assert.ok(
    faceoffActive.pressure.catastrophicRiskPercent > baseline.pressure.catastrophicRiskPercent
  );
  assert.ok(
    (faceoffActive.publicObjectiveProgress["faction-ussr"] ?? 0) >
      (baseline.publicObjectiveProgress["faction-ussr"] ?? 0)
  );
});

test("metadata-driven Suez outcome can resolve as strategic success for Egypt", () => {
  const outcome = evaluateSessionOutcome({
    scenario: suezScenario,
    targetGameLength: "medium",
    turnNumber: 6,
    worldTension: 58,
    escalationRiskPercent: 51,
    visibleTracks: {
      canalControl: 38,
      internationalPressure: 78,
      militaryTempo: 42
    },
    negotiationLeverage: {
      "faction-anglo-french": 42,
      "faction-egypt": 74
    },
    factionMomentum: {
      "faction-anglo-french": 41,
      "faction-egypt": 76
    },
    selectedOption: suezOption
  });

  assert.equal(outcome.status, "ended");
  assert.equal(outcome.category, "strategic_success");
  assert.equal(outcome.winningFactionId, "faction-egypt");
});

test("Suez ceasefire-channel event chain strengthens de-escalation pressure and Egypt progress", () => {
  const baseline = evaluateSessionOutcome({
    scenario: suezScenario,
    targetGameLength: "medium",
    turnNumber: 5,
    worldTension: 55,
    escalationRiskPercent: 49,
    visibleTracks: {
      canalControl: 44,
      internationalPressure: 76,
      militaryTempo: 43
    },
    negotiationLeverage: {
      "faction-anglo-french": 43,
      "faction-egypt": 72
    },
    factionMomentum: {
      "faction-anglo-french": 42,
      "faction-egypt": 74
    },
    selectedOption: suezOption
  });
  const ceasefireVisible = evaluateSessionOutcome({
    scenario: suezScenario,
    targetGameLength: "medium",
    turnNumber: 5,
    worldTension: 55,
    escalationRiskPercent: 49,
    visibleTracks: {
      canalControl: 44,
      internationalPressure: 76,
      militaryTempo: 43
    },
    publicFlags: ["ceasefire-channel-visible"],
    revealedEvents: ["suez-ceasefire-channel-opens"],
    negotiationLeverage: {
      "faction-anglo-french": 43,
      "faction-egypt": 72
    },
    factionMomentum: {
      "faction-anglo-french": 42,
      "faction-egypt": 74
    },
    selectedOption: suezOption
  });

  assert.ok(
    ceasefireVisible.pressure.deescalationOpportunityPercent >
      baseline.pressure.deescalationOpportunityPercent
  );
  assert.ok(
    (ceasefireVisible.publicObjectiveProgress["faction-egypt"] ?? 0) >
      (baseline.publicObjectiveProgress["faction-egypt"] ?? 0)
  );
});

test("Suez intervention-window event chain raises catastrophic pressure and coalition progress", () => {
  const baseline = evaluateSessionOutcome({
    scenario: suezScenario,
    targetGameLength: "medium",
    turnNumber: 5,
    worldTension: 71,
    escalationRiskPercent: 66,
    visibleTracks: {
      canalControl: 55,
      internationalPressure: 63,
      militaryTempo: 74
    },
    negotiationLeverage: {
      "faction-anglo-french": 61,
      "faction-egypt": 48
    },
    factionMomentum: {
      "faction-anglo-french": 69,
      "faction-egypt": 45
    },
    selectedOption: suezOption
  });
  const interventionWindow = evaluateSessionOutcome({
    scenario: suezScenario,
    targetGameLength: "medium",
    turnNumber: 5,
    worldTension: 71,
    escalationRiskPercent: 66,
    visibleTracks: {
      canalControl: 55,
      internationalPressure: 63,
      militaryTempo: 74
    },
    publicFlags: ["intervention-window-hardening"],
    revealedEvents: ["suez-intervention-window-hardens"],
    negotiationLeverage: {
      "faction-anglo-french": 61,
      "faction-egypt": 48
    },
    factionMomentum: {
      "faction-anglo-french": 69,
      "faction-egypt": 45
    },
    selectedOption: suezOption
  });

  assert.ok(
    interventionWindow.pressure.catastrophicRiskPercent >
      baseline.pressure.catastrophicRiskPercent
  );
  assert.ok(
    (interventionWindow.publicObjectiveProgress["faction-anglo-french"] ?? 0) >
      (baseline.publicObjectiveProgress["faction-anglo-french"] ?? 0)
  );
});

test("metadata-driven Suez outcome can settle into stalemate late in a balanced crisis", () => {
  const outcome = evaluateSessionOutcome({
    scenario: suezScenario,
    targetGameLength: "long",
    turnNumber: 9,
    worldTension: 63,
    escalationRiskPercent: 58,
    visibleTracks: {
      canalControl: 53,
      internationalPressure: 62,
      militaryTempo: 54
    },
    negotiationLeverage: {
      "faction-anglo-french": 55,
      "faction-egypt": 56
    },
    factionMomentum: {
      "faction-anglo-french": 54,
      "faction-egypt": 55
    },
    selectedOption: suezOption
  });

  assert.equal(outcome.status, "ended");
  assert.equal(outcome.category, "stalemate");
});

test("short Suez catastrophic endings stay live but do not hard-resolve before the later short-game window", () => {
  const outcome = evaluateSessionOutcome({
    scenario: suezScenario,
    targetGameLength: "short",
    turnNumber: 3,
    worldTension: 89,
    escalationRiskPercent: 90,
    visibleTracks: {
      canalControl: 45,
      internationalPressure: 82,
      militaryTempo: 88
    },
    publicFlags: ["intervention-window-hardening"],
    revealedEvents: ["suez-intervention-window-hardens"],
    negotiationLeverage: {
      "faction-anglo-french": 56,
      "faction-egypt": 49
    },
    factionMomentum: {
      "faction-anglo-french": 60,
      "faction-egypt": 46
    },
    selectedOption: suezOption
  });

  assert.equal(outcome.pressure.maturityPercent, 40);
  assert.equal(outcome.pressure.catastrophicRiskPercent >= 90, true);
  assert.equal(outcome.status, "ongoing");
  assert.equal(outcome.category, null);
});

test("short Berlin catastrophic endings stay live through the first severe short-game exchange", () => {
  const outcome = evaluateSessionOutcome({
    scenario: berlinScenario,
    targetGameLength: "short",
    turnNumber: 3,
    worldTension: 88,
    escalationRiskPercent: 84,
    visibleTracks: {
      diplomaticPressure: 76,
      militaryPosture: 86,
      globalAttention: 79
    },
    publicFlags: ["checkpoint-faceoff-active"],
    revealedEvents: ["berlin-checkpoint-faceoff-intensifies"],
    negotiationLeverage: {
      "faction-usa": 48,
      "faction-ussr": 66
    },
    factionMomentum: {
      "faction-usa": 42,
      "faction-ussr": 71
    },
    selectedOption
  });

  assert.equal(outcome.pressure.maturityPercent, 50);
  assert.equal(outcome.pressure.catastrophicRiskPercent >= 80, true);
  assert.equal(outcome.status, "ongoing");
  assert.equal(outcome.category, null);
});
