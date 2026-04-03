import assert from "node:assert/strict";
import test from "node:test";
import type { ScenarioDefinition } from "@wargame/shared";
import { ProviderInvocationError } from "../../errors/app-error.js";
import type { AdvisorVisibleContext } from "../../repositories/contracts.js";
import type { AdvisorResponseProvider } from "../types.js";
import { OpenAIAdvisorResponseProvider } from "./openai-advisor-response-provider.js";

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
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-usa",
      title: "Expand the airlift",
      summary: "Increase flights while avoiding direct military contact.",
      detail: "Raise tempo and signal commitment without ground escalation.",
      kind: "diplomatic",
      visibility: "public",
      requirementTags: [],
      consequenceHints: ["Shows resolve", "May raise tension modestly"],
      recommendationPercent: 68,
      effectProfile: neutralEffectProfile,
      metadata: {}
    }
  ],
  visibleWarnings: ["Public resolve is being tested."],
  privateBriefing: "Hold access while avoiding a direct clash.",
  visibleIntelligence: ["Soviet pressure is steady but not yet absolute."],
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

test("OpenAI advisor provider returns validated OpenAI output", async () => {
  const provider = new OpenAIAdvisorResponseProvider({
    async requestStructuredOutput() {
      return {
        summary: "Visible conditions support a measured airlift expansion.",
        shortAnswer: "A measured airlift expansion is the best visible move.",
        rationale: [
          "It is the strongest visible option currently available.",
          "Public tension is elevated but not yet at maximum."
        ],
        recommendationBand: "medium",
        confidenceLabel: "medium",
        recommendedOptionIds: ["option-1"],
        confidencePercent: 68,
        riskNotes: ["Visible escalation risk remains meaningful."],
        assumptions: ["This answer uses only supplied visible state."],
        metadata: {
          provider: "ignored-by-mapper"
        }
      };
    }
  });

  const response = await provider.generateAdvisorResponse({
    scenario,
    targetGameLength: "medium",
    question: "What should we do next?",
    context
  });

  assert.equal(
    (response as { metadata: Record<string, unknown> }).metadata.provider,
    "openai-advisor-response"
  );
  assert.deepEqual(
    (response as { recommendedOptionIds: string[] }).recommendedOptionIds,
    ["option-1"]
  );
});

test("OpenAI advisor provider falls back to mock output on provider errors", async () => {
  const fallbackProvider: AdvisorResponseProvider = {
    async generateAdvisorResponse() {
      return {
        summary: "Fallback advisor summary.",
        shortAnswer: "Fallback advisor short answer.",
        rationale: ["Fallback rationale."],
        recommendationBand: "uncertain",
        confidenceLabel: "low",
        recommendedOptionIds: [],
        confidencePercent: 20,
        riskNotes: ["Fallback risk note."],
        assumptions: ["Fallback assumption."],
        metadata: {
          provider: "mock-advisor-response"
        }
      };
    }
  };

  const provider = new OpenAIAdvisorResponseProvider(
    {
      async requestStructuredOutput() {
        throw new ProviderInvocationError("OpenAI request failed.");
      }
    },
    fallbackProvider
  );

  const response = await provider.generateAdvisorResponse({
    scenario,
    targetGameLength: "medium",
    question: "How risky is this?",
    context
  });

  const metadata = (response as { metadata: Record<string, unknown> }).metadata;
  assert.equal(metadata.provider, "openai-advisor-response-fallback");
  assert.equal(metadata.fallbackProvider, "mock-advisor-response");
  assert.equal(metadata.fallbackReason, "provider_invocation_error");
});

test("OpenAI advisor provider falls back to mock output on invalid structured output", async () => {
  const fallbackProvider: AdvisorResponseProvider = {
    async generateAdvisorResponse() {
      return {
        summary: "Fallback advisor summary.",
        shortAnswer: "Fallback advisor short answer.",
        rationale: ["Fallback rationale."],
        recommendationBand: "uncertain",
        confidenceLabel: "low",
        recommendedOptionIds: [],
        confidencePercent: 20,
        riskNotes: ["Fallback risk note."],
        assumptions: ["Fallback assumption."],
        metadata: {
          provider: "mock-advisor-response"
        }
      };
    }
  };

  const provider = new OpenAIAdvisorResponseProvider(
    {
      async requestStructuredOutput() {
        return {
          summary: "Missing required fields should trigger runtime validation."
        };
      }
    },
    fallbackProvider
  );

  const response = await provider.generateAdvisorResponse({
    scenario,
    targetGameLength: "medium",
    question: "What should we do next?",
    context
  });

  const metadata = (response as { metadata: Record<string, unknown> }).metadata;
  assert.equal(metadata.provider, "openai-advisor-response-fallback");
  assert.equal(metadata.fallbackProvider, "mock-advisor-response");
  assert.equal(metadata.fallbackReason, "invalid_provider_output");
});
