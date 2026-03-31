import assert from "node:assert/strict";
import test from "node:test";
import type { ScenarioDefinition } from "@wargame/shared";
import { listLegalOptions } from "./legal-option-service.js";

const neutralEffectProfile = {
  worldTensionDelta: 0,
  escalationRiskDelta: 0,
  visibleTrackDeltas: {},
  negotiationLeverageDeltas: {},
  factionMomentumDeltas: {},
  publicFlagAdds: [],
  publicFlagRemoves: [],
  revealedEventAdds: [],
  warningAdds: []
};

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
      worldTension: 55,
      publicNarrative: "Opening confrontation.",
      headline: "Berlin pressure rises",
      visibleTracks: {
        militaryPosture: 52
      },
      publicFlags: ["berlin-crisis", "airlift-expanded"],
      revealedEvents: ["checkpoint-incident"],
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
      id: "opt-standard",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "diplomatic",
      title: "Standard option",
      summary: "Always legal baseline.",
      visibility: "public",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 55,
      effectProfile: neutralEffectProfile,
      metadata: {}
    },
    {
      id: "opt-secret",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "intelligence",
      title: "Secret-dependent option",
      summary: "Needs the backchannel.",
      visibility: "private",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 60,
      effectProfile: neutralEffectProfile,
      metadata: {
        optionRules: {
          requiredSecretFlags: ["backchannel-open"]
        }
      }
    },
    {
      id: "opt-cooldown",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "military_signal",
      title: "Cooldown option",
      summary: "Should disappear while cooling down.",
      visibility: "public",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 60,
      effectProfile: neutralEffectProfile,
      metadata: {
        optionRules: {
          cooldownRounds: 2
        }
      }
    },
    {
      id: "opt-once",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "diplomatic",
      title: "One-time summit",
      summary: "Available only once.",
      visibility: "public",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 60,
      effectProfile: neutralEffectProfile,
      metadata: {
        optionRules: {
          oncePerGame: true
        }
      }
    },
    {
      id: "opt-followup",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      kind: "special",
      title: "Follow-up template",
      summary: "Template for generated follow-ups.",
      visibility: "public",
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 60,
      effectProfile: neutralEffectProfile,
      metadata: {
        optionRules: {
          followupToOptionIds: ["opt-standard"]
        },
        generatedVariants: [
          {
            id: "opt-followup",
            title: "Follow-up option",
            summary: "Requires earlier setup.",
            recommendationPercent: 65,
            effectProfile: {
              visibleTrackDeltas: {
                militaryPosture: 1
              }
            },
            metadata: {
              optionRules: {
                requiredPublicFlags: ["airlift-expanded"],
                minVisibleTracks: {
                  militaryPosture: 50
                }
              }
            }
          }
        ]
      }
    }
  ],
  metadata: {}
};

test("legal option service filters options by canonical state and usage history", () => {
  const legalOptions = listLegalOptions({
    scenario,
    factionId: "faction-usa",
    publicState: {
      worldTension: 55,
      visibleTracks: {
        militaryPosture: 52
      },
      publicFlags: ["berlin-crisis", "airlift-expanded"],
      revealedEvents: ["checkpoint-incident"]
    },
    privateState: {
      secretFlags: ["backchannel-open"],
      hiddenTracks: {
        allianceConfidence: 61
      },
      metadata: {
        optionUsage: {
          "opt-standard": {
            timesUsed: 1,
            lastUsedRound: 1
          },
          "opt-cooldown": {
            timesUsed: 1,
            lastUsedRound: 2
          },
          "opt-once": {
            timesUsed: 1,
            lastUsedRound: 1
          }
        }
      }
    },
    currentRound: 3
  });

  assert.deepEqual(
    legalOptions.map((option) => option.id).sort(),
    ["opt-followup", "opt-secret", "opt-standard"]
  );
  const followupOption = legalOptions.find((option) => option.id === "opt-followup");
  assert.equal(followupOption?.metadata.generatedFromOptionId, "opt-followup");
});
