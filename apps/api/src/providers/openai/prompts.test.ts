import assert from "node:assert/strict";
import test from "node:test";
import type {
  Game,
  ScenarioDefinition,
  TurnAction
} from "@wargame/shared";
import type { AdvisorVisibleContext } from "../../repositories/contracts.js";
import {
  buildOpenAIAdvisorPrompt,
  buildOpenAITurnGenerationPrompt
} from "./prompts.js";

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
      requirementTags: ["airlift-ready"],
      consequenceHints: ["Shows resolve", "May raise tension modestly"],
      recommendationPercent: 68,
      metadata: {}
    }
  ],
  visibleWarnings: ["Public resolve is being tested."],
  lastAdvisorAnswer: null
};

const game: Game = {
  id: "game-1",
  scenarioId: scenario.id,
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
    public: context.publicState,
    privateByPlayer: [
      {
        gameId: "game-1",
        playerId: "player-1",
        factionId: "faction-usa",
        turnNumber: 1,
        privateBriefing: "Sustain access while avoiding direct confrontation.",
        intelligence: ["Soviet pressure is steady but not yet absolute."],
        hiddenTracks: {},
        secretFlags: ["airlift-network-ready"],
        availableOptions: context.visibleOptions,
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
      warnings: ["Public resolve is being tested."],
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

test("advisor prompt includes explicit visibility and evidence boundaries", () => {
  const prompt = buildOpenAIAdvisorPrompt({
    scenario,
    targetGameLength: "medium",
    question: "What should we do next?",
    context
  });

  assert.match(prompt.instructions, /Answer only from player-visible information/i);
  const parsed = JSON.parse(prompt.prompt) as {
    visibleState: { visibleOptionIds: string[] };
    answerRequirements: { assumptions: string };
    rules: string[];
  };

  assert.deepEqual(parsed.visibleState.visibleOptionIds, ["option-1"]);
  assert.match(parsed.answerRequirements.assumptions, /Use this only for cautious inference/i);
  assert.ok(
    parsed.rules.some((rule) => /Distinguish known facts from inference/i.test(rule))
  );
  assert.ok(
    parsed.rules.some((rule) => /Keep recommendations actionable/i.test(rule))
  );
});

test("turn prompt includes authorized private context and stable next-option constraints", () => {
  const prompt = buildOpenAITurnGenerationPrompt({
    game,
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
    nextOptions: [
      {
        id: "option-2",
        scenarioId: scenario.id,
        factionId: "faction-usa",
        title: "Signal restraint",
        summary: "Reduce immediate public pressure.",
        kind: "diplomatic",
        visibility: "public",
        requirementTags: [],
        consequenceHints: ["Lowers tempo"],
        recommendationPercent: 61,
        metadata: {}
      }
    ]
  });

  assert.match(prompt.instructions, /canonical action, legal moves, turn order/i);
  const parsed = JSON.parse(prompt.prompt) as {
    authorizedPrivateContext: { factionId: string; intelligence: string[] };
    outputRequirements: { recommendedNextOptionIds: string };
    rules: string[];
  };

  assert.equal(parsed.authorizedPrivateContext.factionId, "faction-usa");
  assert.deepEqual(parsed.authorizedPrivateContext.intelligence, [
    "Soviet pressure is steady but not yet absolute."
  ]);
  assert.match(
    parsed.outputRequirements.recommendedNextOptionIds,
    /Only option ids from visibleNextOptions/i
  );
  assert.ok(
    parsed.rules.some((rule) => /Do not leak or invent private facts for other factions/i.test(rule))
  );
});
