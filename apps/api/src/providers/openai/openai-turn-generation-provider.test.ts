import assert from "node:assert/strict";
import test from "node:test";
import type { ScenarioDefinition, Game, TurnAction } from "@wargame/shared";
import { ProviderInvocationError } from "../../errors/app-error.js";
import type { TurnGenerationProvider, TurnGenerationProviderInput } from "../types.js";
import { OpenAITurnGenerationProvider } from "./openai-turn-generation-provider.js";

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

const game: Game = {
  id: "game-1",
  scenarioId: "scenario-cold-war-berlin-mvp",
  mode: "solo",
  status: "in_progress",
  turnNumber: 1,
  phase: "briefing",
  currentFactionId: "faction-usa",
  players: [
    {
      id: "player-1",
      gameId: "game-1",
      name: "Player One",
      role: "human",
      factionId: "faction-usa",
      seat: 0,
      isActive: true,
      createdAt: "1948-06-24T00:00:00.000Z",
      metadata: {}
    }
  ],
  factions: scenario.factions,
  state: {
    public: {
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
    privateByPlayer: [
      {
        gameId: "game-1",
        playerId: "player-1",
        factionId: "faction-usa",
        turnNumber: 1,
        privateBriefing: "",
        intelligence: [],
        hiddenTracks: {},
        secretFlags: [],
        availableOptions: [
          {
            id: "option-1",
            scenarioId: "scenario-cold-war-berlin-mvp",
            factionId: "faction-usa",
            kind: "diplomatic",
            title: "Expand the airlift",
            summary: "Increase flights while avoiding direct military contact.",
            visibility: "public",
            requirementTags: [],
            consequenceHints: ["Shows resolve"],
            recommendationPercent: 68,
            metadata: {}
          }
        ],
        metadata: {}
      }
    ],
    derived: {
      gameId: "game-1",
      turnNumber: 1,
      actingPlayerIds: ["player-1"],
      legalActionIds: ["option-1"],
      recommendedActionIds: ["option-1"],
      escalationRiskPercent: 55,
      negotiationLeverage: {},
      factionMomentum: {},
      warnings: [],
      metadata: {}
    }
  },
  advisorAnswers: [],
  lastResolution: null,
  createdAt: "1948-06-24T00:00:00.000Z",
  updatedAt: "1948-06-24T00:00:00.000Z",
  sessionConfig: {
    targetGameLength: "medium"
  },
  metadata: {}
};

const action: TurnAction = {
  id: "action-1",
  gameId: "game-1",
  turnNumber: 1,
  playerId: "player-1",
  factionId: "faction-usa",
  optionId: "option-1",
  kind: "diplomatic",
  submittedAt: "1948-06-24T00:00:00.000Z",
  declaredIntent: "Demonstrate resolve.",
  parameters: {},
  clientContext: {}
};

const nextOptions = [
  {
    id: "option-2",
    scenarioId: "scenario-cold-war-berlin-mvp",
    factionId: "faction-usa",
    kind: "diplomatic" as const,
    title: "Signal restraint",
    summary: "Reduce immediate public pressure.",
    visibility: "public" as const,
    requirementTags: [],
    consequenceHints: ["Lowers tempo"],
    recommendationPercent: 61,
    metadata: {}
  }
];

const turnProviderInput: TurnGenerationProviderInput = {
  game,
  publicView: {
    ...game,
    state: {
      ...game.state,
      privateByPlayer: []
    }
  },
  actingFactionView: game,
  scenario,
  targetGameLength: "medium",
  action,
  actingPlayer: game.players[0]!,
  actingPrivateState: game.state.privateByPlayer[0]!,
  selectedOption: game.state.privateByPlayer[0]!.availableOptions[0]!,
  nextFactionId: "faction-usa",
  nextTurnNumber: 2,
  tensionDelta: 4,
  nextWorldTension: 62,
  nextOptions
};

type StructuredOutputClient = {
  requestStructuredOutput(input: {
    instructions: string;
    prompt: string;
    schemaName: string;
    schema: Record<string, unknown>;
  }): Promise<unknown>;
};

test("OpenAI turn provider returns validated structured turn artifacts", async () => {
  const provider = new OpenAITurnGenerationProvider({
    async requestStructuredOutput() {
      return {
        publicSummary: "The airlift expands and increases pressure on the crisis.",
        privateSummaries: [
          {
            playerId: "player-1",
            factionId: "faction-usa",
            summary: "Visible momentum favors sustained logistical pressure.",
            tags: ["diplomatic"]
          }
        ],
        effects: ["option:option-1", "world_tension:+4"],
        recommendationLabels: ["measured"],
        riskLabels: ["medium-escalation-risk"],
        recommendedNextOptionIds: [],
        worldUpdateSuggestions: [
          {
            key: "worldTension",
            direction: "increase",
            magnitude: "low",
            rationale: "The move is visible and adds pressure."
          }
        ],
        llmNarrative: {
          headline: "Turn 1: Expand the airlift",
          publicSummary: "Berlin pressure intensifies without direct military engagement.",
          privateUpdates: [],
          consequenceTags: ["diplomatic"],
          followupHooks: ["next-turn-options"],
          metadata: {}
        },
        metadata: {}
      };
    }
  } satisfies StructuredOutputClient);

  const response = await provider.generateTurnArtifacts(turnProviderInput);

  assert.equal(
    (response as { publicSummary: string }).publicSummary.length > 0,
    true
  );
});

test("OpenAI turn provider falls back to mock artifacts on provider errors", async () => {
  const fallbackProvider: TurnGenerationProvider = {
    async generateTurnArtifacts() {
      return {
        publicSummary: "Fallback turn summary.",
        privateSummaries: [],
        effects: ["fallback"],
        recommendationLabels: ["situational"],
        riskLabels: ["measured-risk"],
        recommendedNextOptionIds: [],
        worldUpdateSuggestions: [],
        llmNarrative: {
          headline: "Fallback headline",
          publicSummary: "Fallback narrative",
          privateUpdates: [],
          consequenceTags: [],
          followupHooks: [],
          metadata: {}
        },
        metadata: {
          provider: "mock-turn-generation"
        }
      };
    }
  };

  const provider = new OpenAITurnGenerationProvider(
    {
      async requestStructuredOutput() {
        throw new ProviderInvocationError("OpenAI turn request failed.");
      }
    } satisfies StructuredOutputClient,
    fallbackProvider
  );

  const response = await provider.generateTurnArtifacts(turnProviderInput);

  assert.equal((response as { publicSummary: string }).publicSummary, "Fallback turn summary.");
});
