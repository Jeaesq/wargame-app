import assert from "node:assert/strict";
import test from "node:test";
import type { ScenarioDefinition } from "@wargame/shared";
import { buildAvailableOptions } from "./option-presentation-service.js";

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
  objectives: [],
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
      escalationRiskPercent: 34,
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
  choiceCatalog: [
    {
      id: "opt-dip",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "diplomatic",
      title: "Call an emergency summit",
      summary: "Coordinate allies.",
      visibility: "public",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 60,
      effectProfile: {
        worldTensionDelta: 0,
        escalationRiskDelta: -1,
        visibleTrackDeltas: {},
        negotiationLeverageDeltas: { "faction-usa": 5 },
        factionMomentumDeltas: { "faction-usa": 3 },
        publicFlagAdds: [],
        publicFlagRemoves: [],
        revealedEventAdds: [],
        warningAdds: []
      },
      metadata: {}
    },
    {
      id: "opt-mil",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "military_signal",
      title: "Escort flights",
      summary: "Show resolve.",
      visibility: "public",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 58,
      effectProfile: {
        worldTensionDelta: 8,
        escalationRiskDelta: 8,
        visibleTrackDeltas: {},
        negotiationLeverageDeltas: { "faction-usa": 4 },
        factionMomentumDeltas: { "faction-usa": 5 },
        publicFlagAdds: [],
        publicFlagRemoves: [],
        revealedEventAdds: [],
        warningAdds: []
      },
      metadata: {}
    },
    {
      id: "opt-intel",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "intelligence",
      title: "Probe a backchannel",
      summary: "Quietly test an off-ramp.",
      visibility: "private",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 57,
      effectProfile: {
        worldTensionDelta: -4,
        escalationRiskDelta: -5,
        visibleTrackDeltas: {},
        negotiationLeverageDeltas: { "faction-usa": 2 },
        factionMomentumDeltas: { "faction-usa": 1 },
        publicFlagAdds: [],
        publicFlagRemoves: [],
        revealedEventAdds: [],
        warningAdds: []
      },
      metadata: {}
    },
    {
      id: "opt-prop",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "propaganda",
      title: "Address parliament",
      summary: "Build domestic support.",
      visibility: "public",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 55,
      effectProfile: {
        worldTensionDelta: 1,
        escalationRiskDelta: 0,
        visibleTrackDeltas: {},
        negotiationLeverageDeltas: {},
        factionMomentumDeltas: { "faction-usa": 4 },
        publicFlagAdds: [],
        publicFlagRemoves: [],
        revealedEventAdds: [],
        warningAdds: []
      },
      metadata: {}
    },
    {
      id: "opt-eco",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "economic",
      title: "Tighten shipping controls",
      summary: "Raise non-military costs.",
      visibility: "public",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 56,
      effectProfile: {
        worldTensionDelta: 3,
        escalationRiskDelta: 2,
        visibleTrackDeltas: {},
        negotiationLeverageDeltas: { "faction-usa": 3 },
        factionMomentumDeltas: {},
        publicFlagAdds: [],
        publicFlagRemoves: [],
        revealedEventAdds: [],
        warningAdds: []
      },
      metadata: {}
    }
  ],
  metadata: {}
};

test("available options stay concise, diverse, and analytically explained", () => {
  const options = buildAvailableOptions({
    scenario,
    factionId: "faction-usa",
    publicState: {
      worldTension: 72,
      visibleTracks: {
        diplomaticPressure: 61,
        globalAttention: 67
      }
    },
    derivedState: {
      escalationRiskPercent: 76,
      negotiationLeverage: {
        "faction-usa": 49,
        "faction-ussr": 58
      },
      factionMomentum: {
        "faction-usa": 47,
        "faction-ussr": 55
      },
      outcome: {
        status: "ongoing",
        category: null,
        title: null,
        summary: null,
        winningFactionId: null,
        achievedAtTurn: null,
        pressure: {
          maturityPercent: 64,
          decisiveOutcomePercent: 42,
          deescalationOpportunityPercent: 62,
          catastrophicRiskPercent: 74
        },
        publicObjectiveProgress: {
          "faction-usa": 46,
          "faction-ussr": 57
        },
        metadata: {}
      }
    },
    targetGameLength: "medium",
    recommendationNotes: [
      {
        optionId: "opt-intel",
        rationale: "Quiet contact is attractive because overt pressure is already near its limit."
      }
    ]
  });

  assert.equal(options.length, 4);
  assert.equal(
    new Set(
      options.map((option) => String(option.metadata.presentationCategory))
    ).size >= 3,
    true
  );
  assert.equal(options.some((option) => option.id === "opt-intel"), true);
  assert.equal(
    options.every((option) => typeof option.detail === "string" && option.detail.includes("Why now:")),
    true
  );
});
