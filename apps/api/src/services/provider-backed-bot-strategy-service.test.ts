import assert from "node:assert/strict";
import test from "node:test";
import type { Game, ScenarioDefinition } from "@wargame/shared";
import { ProviderBackedBotStrategyService } from "./provider-backed-bot-strategy-service.js";

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
    },
    {
      id: "faction-ussr",
      scenarioId: "scenario-cold-war-berlin-mvp",
      slug: "ussr",
      name: "Soviet Bloc",
      role: "major_power",
      description: "Eastern bloc.",
      doctrineSummary: "Apply pressure and preserve leverage.",
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
      activeFactionId: "faction-ussr",
      phase: "briefing",
      worldTension: 60,
      publicNarrative: "Opening confrontation.",
      headline: "Berlin pressure rises",
      visibleTracks: {
        diplomaticPressure: 60,
        militaryPosture: 50
      },
      publicFlags: ["berlin-crisis"],
      revealedEvents: [],
      metadata: {}
    },
    privateStates: [],
    derivedState: {
      escalationRiskPercent: 50,
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
          maturityPercent: 40,
          decisiveOutcomePercent: 30,
          deescalationOpportunityPercent: 35,
          catastrophicRiskPercent: 45
        },
        publicObjectiveProgress: {
          "faction-usa": 52,
          "faction-ussr": 48
        },
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

function createGame(overrides?: {
  escalationRiskPercent?: number;
  progress?: Record<string, number>;
  hiddenTracks?: Record<string, number>;
}) {
  const visibleOptions = [
    {
      id: "option-ussr-pressure",
      scenarioId: scenario.id,
      factionId: "faction-ussr",
      kind: "economic" as const,
      title: "Tighten pressure",
      summary: "Increase coercive friction.",
      visibility: "public" as const,
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 55,
      effectProfile: {
        worldTensionDelta: 5,
        escalationRiskDelta: 4,
        visibleTrackDeltas: {},
        negotiationLeverageDeltas: {
          "faction-ussr": 5
        },
        factionMomentumDeltas: {
          "faction-ussr": 4
        },
        publicFlagAdds: [],
        publicFlagRemoves: [],
        revealedEventAdds: [],
        warningAdds: []
      },
      metadata: {}
    },
    {
      id: "option-ussr-backchannel",
      scenarioId: scenario.id,
      factionId: "faction-ussr",
      kind: "diplomatic" as const,
      title: "Open backchannel",
      summary: "Test a controlled off-ramp.",
      visibility: "private" as const,
      requirementTags: [],
      consequenceHints: [],
      recommendationPercent: 57,
      effectProfile: {
        worldTensionDelta: -4,
        escalationRiskDelta: -5,
        visibleTrackDeltas: {},
        negotiationLeverageDeltas: {
          "faction-ussr": 2
        },
        factionMomentumDeltas: {
          "faction-ussr": 1
        },
        publicFlagAdds: [],
        publicFlagRemoves: [],
        revealedEventAdds: [],
        warningAdds: []
      },
      metadata: {}
    }
  ];

  const game: Game = {
    id: "game-1",
    scenarioId: scenario.id,
    ownerUserId: "local-dev-user",
    mode: "solo",
    status: "in_progress",
    turnNumber: 2,
    phase: "briefing",
    currentFactionId: "faction-ussr",
    players: [
      {
        id: "player-usa",
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
        id: "player-ussr",
        gameId: "game-1",
        name: "USSR AI",
        role: "ai",
        userId: null,
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
        turnNumber: 2,
        activeFactionId: "faction-ussr",
        phase: "briefing",
        worldTension: 60,
        publicNarrative: "Pressure is rising.",
        headline: "Berlin pressure rises",
        visibleTracks: {
          diplomaticPressure: 60,
          militaryPosture: 50
        },
        publicFlags: ["berlin-crisis"],
        revealedEvents: [],
        updatedAt: "1948-06-24T00:00:00.000Z",
        metadata: {}
      },
      privateByPlayer: [
        {
          gameId: "game-1",
          playerId: "player-usa",
          factionId: "faction-usa",
          turnNumber: 2,
          privateBriefing: "Hold access.",
          intelligence: [],
          hiddenTracks: {},
          secretFlags: [],
          availableOptions: [],
          metadata: {}
        },
        {
          gameId: "game-1",
          playerId: "player-ussr",
          factionId: "faction-ussr",
          turnNumber: 2,
          privateBriefing: "Sustain pressure.",
          intelligence: [],
          hiddenTracks: overrides?.hiddenTracks ?? {
            pressureWindow: 70,
            commandConfidence: 60
          },
          secretFlags: ["pressure-advantage"],
          availableOptions: visibleOptions,
          metadata: {}
        }
      ],
      derived: {
        gameId: "game-1",
        turnNumber: 2,
        actingPlayerIds: ["player-ussr"],
        legalActionIds: visibleOptions.map((option) => option.id),
        recommendedActionIds: visibleOptions.map((option) => option.id),
        escalationRiskPercent: overrides?.escalationRiskPercent ?? 52,
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
            maturityPercent: 45,
            decisiveOutcomePercent: 30,
            deescalationOpportunityPercent: 35,
            catastrophicRiskPercent: 45
          },
          publicObjectiveProgress:
            overrides?.progress ?? {
              "faction-usa": 54,
              "faction-ussr": 46
            },
          metadata: {}
        },
        warnings: [],
        metadata: {}
      }
    },
    progression: {
      model: "solo_round",
      currentRound: 2,
      currentRoundActionIndex: 2,
      roundActionCount: 2,
      completedRoundCount: 1
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

  return game;
}

test("bot strategy varies between pressure and restraint based on canonical state", async () => {
  const service = new ProviderBackedBotStrategyService({
    async chooseBotDecision() {
      return null;
    }
  });

  const pressureChoice = await service.chooseAction({
    game: createGame({
      escalationRiskPercent: 52,
      progress: {
        "faction-usa": 56,
        "faction-ussr": 44
      },
      hiddenTracks: {
        pressureWindow: 75,
        commandConfidence: 62
      }
    }),
    scenario,
    factionId: "faction-ussr"
  });

  const restraintChoice = await service.chooseAction({
    game: createGame({
      escalationRiskPercent: 82,
      progress: {
        "faction-usa": 48,
        "faction-ussr": 55
      },
      hiddenTracks: {
        pressureWindow: 52,
        commandConfidence: 48
      }
    }),
    scenario,
    factionId: "faction-ussr"
  });

  assert.equal(pressureChoice?.optionId, "option-ussr-pressure");
  assert.equal(restraintChoice?.optionId, "option-ussr-backchannel");
});

test("bot strategy reflects faction doctrine instead of using one shared preference curve", async () => {
  const service = new ProviderBackedBotStrategyService({
    async chooseBotDecision() {
      return null;
    }
  });

  const usaGame = createGame({
    escalationRiskPercent: 78,
    progress: {
      "faction-usa": 47,
      "faction-ussr": 53
    },
    hiddenTracks: {
      allianceConfidence: 49,
      domesticPressure: 46
    }
  });

  usaGame.currentFactionId = "faction-usa";
  usaGame.state.public.activeFactionId = "faction-usa";
  usaGame.state.privateByPlayer[0] = {
    ...usaGame.state.privateByPlayer[0]!,
    availableOptions: [
      {
        id: "option-usa-airlift",
        scenarioId: scenario.id,
        factionId: "faction-usa",
        kind: "military_signal",
        title: "Expand airlift operations",
        summary: "Show resolve.",
        visibility: "public",
        requirementTags: [],
        consequenceHints: [],
        recommendationPercent: 61,
        effectProfile: {
          worldTensionDelta: 8,
          escalationRiskDelta: 6,
          visibleTrackDeltas: {},
          negotiationLeverageDeltas: {
            "faction-usa": 5
          },
          factionMomentumDeltas: {
            "faction-usa": 4
          },
          publicFlagAdds: [],
          publicFlagRemoves: [],
          revealedEventAdds: [],
          warningAdds: []
        },
        metadata: {}
      },
      {
        id: "option-usa-backchannel",
        scenarioId: scenario.id,
        factionId: "faction-usa",
        kind: "intelligence",
        title: "Use backchannels",
        summary: "Test an off-ramp.",
        visibility: "private",
        requirementTags: [],
        consequenceHints: [],
        recommendationPercent: 56,
        effectProfile: {
          worldTensionDelta: -5,
          escalationRiskDelta: -6,
          visibleTrackDeltas: {},
          negotiationLeverageDeltas: {
            "faction-usa": 2
          },
          factionMomentumDeltas: {
            "faction-usa": 1
          },
          publicFlagAdds: [],
          publicFlagRemoves: [],
          revealedEventAdds: [],
          warningAdds: []
        },
        metadata: {}
      }
    ],
    hiddenTracks: {
      allianceConfidence: 49,
      domesticPressure: 46
    }
  };
  usaGame.state.privateByPlayer[1] = {
    ...usaGame.state.privateByPlayer[1]!,
    availableOptions: []
  };
  usaGame.state.derived.actingPlayerIds = ["player-usa"];
  usaGame.state.derived.legalActionIds = ["option-usa-airlift", "option-usa-backchannel"];
  usaGame.state.derived.recommendedActionIds = ["option-usa-airlift", "option-usa-backchannel"];

  const usaChoice = await service.chooseAction({
    game: usaGame,
    scenario,
    factionId: "faction-usa"
  });

  assert.equal(usaChoice?.optionId, "option-usa-backchannel");
  assert.match(usaChoice?.rationale ?? "", /measured resolve/i);
});

test("bot strategy honors scenario-authored doctrine overrides for the same faction slug", async () => {
  const customScenario: ScenarioDefinition = {
    ...scenario,
    id: "scenario-custom-berlin-variant",
    slug: "custom-berlin-variant",
    factions: [
      {
        ...scenario.factions[0]!,
        metadata: {
          strategyProfile: {
            doctrineLabel: "public legitimacy first",
            preferredCategories: ["propaganda", "diplomatic"],
            cautiousCategories: ["military"],
            categoryBiases: {
              propaganda: 6,
              diplomatic: 2,
              intelligence: -1
            },
            pressureBias: 1,
            restraintBias: 8,
            initiativeBias: 3,
            scenarioFocus: "public legitimacy under sustained scrutiny"
          }
        }
      },
      scenario.factions[1]!
    ]
  };
  const service = new ProviderBackedBotStrategyService({
    async chooseBotDecision() {
      return null;
    }
  });
  const customGame = createGame({
    escalationRiskPercent: 64,
    progress: {
      "faction-usa": 48,
      "faction-ussr": 51
    },
    hiddenTracks: {
      allianceConfidence: 52,
      domesticPressure: 61
    }
  });

  customGame.scenarioId = customScenario.id;
  customGame.currentFactionId = "faction-usa";
  customGame.factions = customScenario.factions;
  customGame.state.public.scenarioId = customScenario.id;
  customGame.state.public.activeFactionId = "faction-usa";
  customGame.state.privateByPlayer[0] = {
    ...customGame.state.privateByPlayer[0]!,
    factionId: "faction-usa",
    availableOptions: [
      {
        id: "option-usa-speech",
        scenarioId: customScenario.id,
        factionId: "faction-usa",
        kind: "propaganda",
        title: "Stage a public air-corridor address",
        summary: "Frame the crisis as a legitimacy test.",
        visibility: "public",
        requirementTags: [],
        consequenceHints: [],
        recommendationPercent: 55,
        effectProfile: {
          worldTensionDelta: 1,
          escalationRiskDelta: 0,
          visibleTrackDeltas: {},
          negotiationLeverageDeltas: {
            "faction-usa": 3
          },
          factionMomentumDeltas: {
            "faction-usa": 2
          },
          publicFlagAdds: [],
          publicFlagRemoves: [],
          revealedEventAdds: [],
          warningAdds: []
        },
        metadata: {}
      },
      {
        id: "option-usa-backchannel",
        scenarioId: customScenario.id,
        factionId: "faction-usa",
        kind: "intelligence",
        title: "Use backchannels",
        summary: "Test a quiet off-ramp.",
        visibility: "private",
        requirementTags: [],
        consequenceHints: [],
        recommendationPercent: 56,
        effectProfile: {
          worldTensionDelta: -4,
          escalationRiskDelta: -4,
          visibleTrackDeltas: {},
          negotiationLeverageDeltas: {
            "faction-usa": 2
          },
          factionMomentumDeltas: {
            "faction-usa": 1
          },
          publicFlagAdds: [],
          publicFlagRemoves: [],
          revealedEventAdds: [],
          warningAdds: []
        },
        metadata: {}
      }
    ],
    hiddenTracks: {
      allianceConfidence: 52,
      domesticPressure: 61
    }
  };
  customGame.state.privateByPlayer[1] = {
    ...customGame.state.privateByPlayer[1]!,
    availableOptions: []
  };
  customGame.state.derived.actingPlayerIds = ["player-usa"];
  customGame.state.derived.legalActionIds = ["option-usa-speech", "option-usa-backchannel"];
  customGame.state.derived.recommendedActionIds = [
    "option-usa-speech",
    "option-usa-backchannel"
  ];

  const customChoice = await service.chooseAction({
    game: customGame,
    scenario: customScenario,
    factionId: "faction-usa"
  });

  assert.equal(customChoice?.optionId, "option-usa-speech");
  assert.match(customChoice?.rationale ?? "", /public legitimacy first/i);
  assert.match(customChoice?.rationale ?? "", /public legitimacy under sustained scrutiny/i);
});
