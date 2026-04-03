import assert from "node:assert/strict";
import test from "node:test";
import type { ScenarioDefinition } from "@wargame/shared";
import type { AdvisorVisibleContext } from "../repositories/contracts.js";
import { ProviderBackedAdvisorService } from "./provider-backed-advisor-service.js";

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
  title: "Berlin Airlift Crisis",
  description: "A constrained Cold War crisis.",
  historicalFrame: "1948 Berlin blockade tensions.",
  complexity: "standard",
  supportedModes: ["solo", "hotseat"],
  maxPlayers: 2,
  startingTurn: 1,
  objectives: [
    {
      id: "objective-usa",
      factionId: "faction-usa",
      title: "Hold access",
      summary: "Keep Berlin supplied while avoiding uncontrolled escalation.",
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
      name: "United States",
      role: "major_power",
      description: "Western airlift coordinator.",
      doctrineSummary: "Sustain access while avoiding direct war.",
      publicTraits: ["airlift"],
      privateTraits: ["intelligence"],
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
      headline: "Berlin access under pressure",
      publicNarrative: "Supply routes are contested.",
      worldTension: 58,
      visibleTracks: {},
      publicFlags: [],
      revealedEvents: [],
      metadata: {}
    },
    privateStates: [],
    derivedState: {
      escalationRiskPercent: 55,
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
          maturityPercent: 10,
          decisiveOutcomePercent: 20,
          deescalationOpportunityPercent: 40,
          catastrophicRiskPercent: 50
        },
        publicObjectiveProgress: {
          "faction-usa": 50
        },
        metadata: {}
      },
      warnings: ["Public resolve is being tested."],
      metadata: {}
    },
    initialOptions: []
  },
  choiceCatalog: [],
  metadata: {}
};

const context: AdvisorVisibleContext = {
  gameId: "game-1",
  turnNumber: 1,
  factionId: "faction-usa",
  playerId: "player-1",
  likelyOpponentFactionId: "faction-ussr",
  publicState: {
    gameId: "game-1",
    scenarioId: "scenario-cold-war-berlin-mvp",
    turnNumber: 1,
    activeFactionId: "faction-usa",
    phase: "briefing",
    headline: "Berlin access under pressure",
    publicNarrative: "Supply routes are contested.",
    worldTension: 58,
    visibleTracks: {},
    publicFlags: [],
    revealedEvents: [],
    updatedAt: "1948-06-24T00:00:00.000Z",
    metadata: {}
  },
  visibleOutcome: {
    status: "ongoing",
    category: null,
    title: null,
    summary: null,
    winningFactionId: null,
    achievedAtTurn: null,
    pressure: {
      maturityPercent: 10,
      decisiveOutcomePercent: 20,
      deescalationOpportunityPercent: 40,
      catastrophicRiskPercent: 50
    },
    publicObjectiveProgress: {
      "faction-usa": 50
    },
    metadata: {}
  },
  visibleOptions: [
    {
      id: "option-1",
      scenarioId: scenario.id,
      factionId: "faction-usa",
      title: "Expand the airlift",
      summary: "Increase flights while avoiding direct military contact.",
      kind: "diplomatic",
      visibility: "public",
      requirementTags: [],
      consequenceHints: ["Shows resolve"],
      recommendationPercent: 68,
      effectProfile: neutralEffectProfile,
      metadata: {}
    }
  ],
  visibleWarnings: [],
  privateBriefing: "Hold access while avoiding a direct clash.",
  visibleIntelligence: ["Public resolve is being tested."],
  strategicAssessment: {
    doctrineLabel: "measured resolve",
    preferredCategories: ["diplomatic", "intelligence"],
    cautiousCategories: ["military"],
    scenarioFocus: "superpower signaling and allied credibility in Berlin",
    ownObjectivePressure: 50,
    rivalObjectivePressure: 50,
    escalationRiskPercent: 55,
    worldTension: 58,
    strategicPosture: "contest",
    visiblePriority:
      "The visible contest is still balanced, so measured resolve should guide which legal pressure you apply next."
  },
  likelyOpponentAssessment: {
    doctrineLabel: "coercive leverage below the threshold of war",
    preferredCategories: ["economic", "military", "diplomatic"],
    cautiousCategories: ["military"],
    scenarioFocus: "pressure, ambiguity, and bargaining leverage in Berlin",
    ownObjectivePressure: 50,
    rivalObjectivePressure: 50,
    escalationRiskPercent: 55,
    worldTension: 58,
    strategicPosture: "contest",
    visiblePriority:
      "Berlin still rewards coercive leverage, so sustained pressure should outpace Western reassurance without making the crisis obviously uncontrollable."
  },
  advisorFraming: {
    roundLabel: "Round 1",
    pacingWindow: "opening",
    pacingSummary:
      "Round 1 is in the opening phase, with room to improve leverage if the next move stays disciplined.",
    pressureSummary:
      "Visible pressure is contested: decisive pressure is 20% and de-escalation opportunity is 40%.",
    opponentSummary:
      "Likely opponent posture points toward coercive leverage below the threshold of war, with priority on berlin still rewards coercive leverage, so sustained pressure should outpace western reassurance without making the crisis obviously uncontrollable.",
    optionComparisons: [
      {
        optionId: "option-1",
        title: "Expand the airlift",
        doctrineFit: "strong",
        pressureRole: "hold_line",
        rationale:
          "Expand the airlift fits the current doctrine well because it fits current doctrine, and it sustains pressure without forcing an immediate rupture.",
        riskSummary:
          "Visible downside: this choice may preserve flexibility but give up short-term initiative."
      }
    ]
  },
  lastAdvisorAnswer: null
};

test("advisor service filters recommended options to visible ids and caps the result list", async () => {
  const service = new ProviderBackedAdvisorService(
    {
      async generateAdvisorResponse() {
        return {
          summary: "Visible conditions support a measured airlift expansion.",
          shortAnswer: "Expand the airlift.",
          rationale: ["The visible option is currently strongest."],
          recommendationBand: "medium",
          confidenceLabel: "medium",
          recommendedOptionIds: ["option-1", "option-2", "option-secret", "option-1"],
          confidencePercent: 67,
          riskNotes: ["Public pressure could still rise."],
          assumptions: ["No hidden intelligence was used."],
          metadata: {
            provider: "openai-advisor-response"
          }
        };
      }
    },
    () => "1948-06-24T00:00:00.000Z"
  );

  const answer = await service.generateAdvisorAnswer({
    scenario,
    targetGameLength: "medium",
    question: "What should we do next?",
    context: {
      ...context,
      visibleOptions: [
        ...context.visibleOptions,
        {
          id: "option-2",
          scenarioId: scenario.id,
          factionId: "faction-usa",
          title: "Signal restraint",
          summary: "Reduce immediate public pressure.",
          kind: "diplomatic",
          visibility: "public",
          requirementTags: [],
          consequenceHints: ["Preserves flexibility"],
          recommendationPercent: 61,
          effectProfile: neutralEffectProfile,
          metadata: {}
        }
      ]
    }
  });

  assert.deepEqual(answer.recommendedOptionIds, ["option-1", "option-2"]);
});
