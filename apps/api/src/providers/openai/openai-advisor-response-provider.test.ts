import assert from "node:assert/strict";
import test from "node:test";
import type { ScenarioDefinition } from "@wargame/shared";
import { ProviderInvocationError } from "../../errors/app-error.js";
import type { AdvisorVisibleContext } from "../../repositories/contracts.js";
import type { AdvisorResponseProvider } from "../types.js";
import { OpenAIAdvisorResponseProvider } from "./openai-advisor-response-provider.js";

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
      metadata: {}
    }
  ],
  visibleWarnings: ["Public resolve is being tested."],
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
    question: "What should we do next?",
    context
  });

  const metadata = (response as { metadata: Record<string, unknown> }).metadata;
  assert.equal(metadata.provider, "openai-advisor-response-fallback");
  assert.equal(metadata.fallbackProvider, "mock-advisor-response");
  assert.equal(metadata.fallbackReason, "invalid_provider_output");
});
