import assert from "node:assert/strict";
import test from "node:test";
import type { Game, ScenarioDefinition, TurnAction } from "@wargame/shared";
import { ProviderBackedTurnResolutionService } from "./provider-backed-turn-resolution-service.js";

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
      summary: "Keep Berlin supplied without losing escalation control.",
      successSignals: [],
      failureSignals: [],
      visibility: "public",
      metadata: {}
    },
    {
      id: "objective-ussr",
      factionId: "faction-ussr",
      title: "Sustain pressure",
      summary: "Force leverage without sliding into war.",
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
    },
    {
      id: "faction-ussr",
      scenarioId: "scenario-cold-war-berlin-mvp",
      slug: "ussr",
      name: "Soviet Union",
      role: "major_power",
      description: "Blockade sponsor.",
      doctrineSummary: "Maintain pressure without surrendering leverage.",
      publicTraits: ["pressure"],
      privateTraits: ["countermove"],
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
          "faction-usa": 50,
          "faction-ussr": 50
        },
        metadata: {}
      },
      warnings: [],
      metadata: {}
    },
    initialOptions: []
  },
  choiceCatalog: [
    {
      id: "option-2",
      scenarioId: "scenario-cold-war-berlin-mvp",
      factionId: "faction-ussr",
      kind: "diplomatic",
      title: "Signal restraint",
      summary: "Reduce immediate public pressure.",
      visibility: "public",
      requirementTags: [],
      consequenceHints: ["Lowers tempo"],
      recommendationPercent: 61,
      effectProfile: neutralEffectProfile,
      metadata: {}
    }
  ],
  metadata: {}
};

const game: Game = {
  id: "game-1",
  scenarioId: scenario.id,
  ownerUserId: "local-dev-user",
  mode: "head_to_head",
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
      userId: "local-dev-user",
      factionId: "faction-usa",
      seat: 0,
      isActive: true,
      createdAt: "1948-06-24T00:00:00.000Z",
      metadata: {}
    },
    {
      id: "player-2",
      gameId: "game-1",
      name: "Player Two",
      role: "human",
      userId: "local-dev-user",
      factionId: "faction-ussr",
      seat: 1,
      isActive: true,
      createdAt: "1948-06-24T00:00:00.000Z",
      metadata: {}
    }
  ],
  factions: scenario.factions,
  state: {
    public: {
      gameId: "game-1",
      scenarioId: scenario.id,
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
        privateBriefing: "Hold access routes.",
        intelligence: ["Pressure remains high."],
        hiddenTracks: {},
        secretFlags: ["airlift-ready"],
        availableOptions: [
          {
            id: "option-1",
            scenarioId: scenario.id,
            factionId: "faction-usa",
            kind: "diplomatic",
            title: "Expand the airlift",
            summary: "Increase flights while avoiding direct military contact.",
            visibility: "public",
            requirementTags: [],
            consequenceHints: ["Shows resolve"],
            recommendationPercent: 68,
            effectProfile: neutralEffectProfile,
            metadata: {}
          }
        ],
        metadata: {}
      },
      {
        gameId: "game-1",
        playerId: "player-2",
        factionId: "faction-ussr",
        turnNumber: 1,
        privateBriefing: "Sustain pressure.",
        intelligence: [],
        hiddenTracks: {},
        secretFlags: [],
        availableOptions: [],
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
          "faction-usa": 50,
          "faction-ussr": 50
        },
        metadata: {}
      },
      warnings: [],
      metadata: {}
    }
  },
  advisorAnswers: [],
  lastResolution: null,
  createdAt: "1948-06-24T00:00:00.000Z",
  updatedAt: "1948-06-24T00:00:00.000Z",
  sessionConfig: {
    targetGameLength: "medium",
    debug: {
      mode: "off",
      seed: null,
      streamCounters: {}
    }
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

test("turn resolution service keeps private artifacts scoped to the acting faction", async () => {
  const service = new ProviderBackedTurnResolutionService(
    {
      async generateTurnArtifacts() {
        return {
          publicSummary: "The airlift expands and pressure rises.",
          privateSummaries: [
            {
              playerId: "player-1",
              factionId: "faction-usa",
              summary: "Authorized USA summary.",
              tags: ["authorized"]
            },
            {
              playerId: "player-2",
              factionId: "faction-ussr",
              summary: "Unauthorized USSR summary.",
              tags: ["leak"]
            }
          ],
          effects: ["option:option-1", "world_tension:+4"],
          recommendationLabels: ["measured"],
          riskLabels: ["medium-escalation-risk"],
          recommendedNextOptionIds: ["option-2"],
          recommendedOptionNotes: [
            {
              optionId: "option-2",
              rationale: "Signal restraint is safer now that pressure is already rising."
            }
          ],
          worldUpdateSuggestions: [],
          llmNarrative: {
            headline: "Turn 1: Expand the airlift",
            publicSummary: "Berlin pressure intensifies without direct military engagement.",
            privateUpdates: [
              {
                factionId: "faction-usa",
                summary: "Authorized USA private update.",
                tags: ["authorized"]
              },
              {
                factionId: "faction-ussr",
                summary: "Unauthorized USSR private update.",
                tags: ["leak"]
              }
            ],
            consequenceTags: ["diplomatic"],
            followupHooks: ["next-turn-options"],
            metadata: {}
          },
          metadata: {}
        };
      }
    },
    () => "1948-06-24T00:00:00.000Z"
  );

  const result = await service.resolveTurn({
    game,
    scenario,
    action
  });

  assert.deepEqual(result.resolution.privateSummaries, [
    {
      playerId: "player-1",
      factionId: "faction-usa",
      summary: "Authorized USA summary.",
      tags: ["authorized"]
    }
  ]);
  assert.deepEqual(result.resolution.llmNarrative.privateUpdates, [
    {
      factionId: "faction-usa",
      summary: "Authorized USA private update.",
      tags: ["authorized"]
    }
  ]);
  assert.deepEqual(result.updatedGame.state.derived.recommendedActionIds, ["option-2"]);
  assert.equal(result.updatedGame.state.derived.outcome.status, "ongoing");
});

test("turn resolution provider receives canonical and projected visibility views", async () => {
  let receivedInput:
    | {
        gamePrivateStateCount: number;
        publicViewPrivateStateCount: number;
        actingFactionViewPrivateStateCount: number;
        actingFactionViewFactionId: string | null;
      }
    | undefined;

  const service = new ProviderBackedTurnResolutionService(
    {
      async generateTurnArtifacts(input) {
        receivedInput = {
          gamePrivateStateCount: input.game.state.privateByPlayer.length,
          publicViewPrivateStateCount: input.publicView.state.privateByPlayer.length,
          actingFactionViewPrivateStateCount:
            input.actingFactionView.state.privateByPlayer.length,
          actingFactionViewFactionId:
            input.actingFactionView.state.privateByPlayer[0]?.factionId ?? null
        };

        return {
          publicSummary: "The airlift expands and pressure rises.",
          privateSummaries: [],
          effects: ["option:option-1", "world_tension:+4"],
          recommendationLabels: ["measured"],
          riskLabels: ["medium-escalation-risk"],
          recommendedNextOptionIds: ["option-2"],
          recommendedOptionNotes: [],
          worldUpdateSuggestions: [],
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
    },
    () => "1948-06-24T00:00:00.000Z"
  );

  await service.resolveTurn({
    game,
    scenario,
    action
  });

  assert.deepEqual(receivedInput, {
    gamePrivateStateCount: 2,
    publicViewPrivateStateCount: 0,
    actingFactionViewPrivateStateCount: 1,
    actingFactionViewFactionId: "faction-usa"
  });
});
