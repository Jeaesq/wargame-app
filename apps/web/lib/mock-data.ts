import type {
  AdvisorAnswer,
  ChoiceOption,
  Faction,
  Game,
  PrivatePlayerState,
  ScenarioDefinition,
  TurnResolution
} from "@wargame/shared";

const now = "2026-03-28T20:00:00.000Z";

export const mockScenario: ScenarioDefinition = {
  id: "scenario-cold-war-berlin-mvp",
  slug: "cold-war-berlin-mvp",
  title: "Berlin Crisis MVP",
  description:
    "A focused Cold War crisis scenario about pressure, access, deterrence, and miscalculation.",
  historicalFrame:
    "A Berlin-style confrontation where competing signals can either stabilize the situation or push it toward catastrophe.",
  complexity: "introductory",
  supportedModes: ["solo", "head_to_head"],
  maxPlayers: 2,
  startingTurn: 1,
  factions: [
    {
      id: "faction-usa",
      scenarioId: "scenario-cold-war-berlin-mvp",
      slug: "usa",
      name: "United States Bloc",
      role: "major_power",
      description: "Western coalition focused on access, resolve, and alliance cohesion.",
      doctrineSummary:
        "Preserve credibility, keep escalation bounded, and deny easy coercive victories.",
      publicTraits: ["allied-access", "public-credibility"],
      privateTraits: ["intel-confidence", "domestic-pressure"],
      colorToken: "blue",
      isPlayable: true,
      metadata: {}
    },
    {
      id: "faction-ussr",
      scenarioId: "scenario-cold-war-berlin-mvp",
      slug: "ussr",
      name: "Soviet Bloc",
      role: "major_power",
      description: "Eastern bloc leadership applying pressure while testing Western limits.",
      doctrineSummary:
        "Exploit ambiguity, gain leverage, and avoid a spiral into open war.",
      publicTraits: ["regional-pressure", "administrative-control"],
      privateTraits: ["command-confidence", "pressure-window"],
      colorToken: "red",
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
      publicNarrative:
        "Transport access around Berlin has tightened, and both blocs are calibrating their next signal.",
      headline: "Access restrictions sharpen the crisis",
      visibleTracks: {
        diplomaticPressure: 55,
        militaryPosture: 40,
        globalAttention: 63
      },
      publicFlags: ["berlin-crisis", "checkpoint-friction"],
      revealedEvents: ["checkpoint-restrictions"],
      metadata: {}
    },
    privateStates: [
      {
        factionId: "faction-usa",
        privateBriefing:
          "Alliance confidence is stable, but public weakness would carry domestic cost.",
        intelligence: [
          "Soviet planners may be testing for a limited response.",
          "Backchannel diplomats remain cautiously reachable."
        ],
        hiddenTracks: {
          allianceConfidence: 62,
          domesticPressure: 48
        },
        secretFlags: ["backchannel-open"],
        visibleOptionIds: [],
        metadata: {}
      },
      {
        factionId: "faction-ussr",
        privateBriefing:
          "Pressure appears effective, but a visible Western mobilization could erase that advantage.",
        intelligence: [
          "Western political messaging remains divided on acceptable risk."
        ],
        hiddenTracks: {
          commandConfidence: 58,
          pressureWindow: 67
        },
        secretFlags: ["pressure-advantage"],
        visibleOptionIds: [],
        metadata: {}
      }
    ],
    derivedState: {
      escalationRiskPercent: 34,
      negotiationLeverage: {
        "faction-usa": 52,
        "faction-ussr": 49
      },
      factionMomentum: {
        "faction-usa": 50,
        "faction-ussr": 50
      },
      warnings: ["An overreaction this turn could harden the crisis unexpectedly."],
      metadata: {}
    }
  },
  choiceCatalog: [],
  metadata: {}
};

const mockFactions: Faction[] = mockScenario.factions;

const mockOptions: ChoiceOption[] = [
  {
    id: "option-usa-protest",
    scenarioId: mockScenario.id,
    factionId: "faction-usa",
    kind: "diplomatic",
    title: "Issue a formal protest",
    summary: "Condemn access restrictions while signaling the door remains open to talks.",
    detail:
      "Low immediate escalation, but limited leverage if the opponent reads it as rhetorical only.",
    visibility: "public",
    requirementTags: ["briefing"],
    consequenceHints: ["lower-escalation", "limited-leverage"],
    recommendationPercent: 61,
    metadata: {}
  },
  {
    id: "option-usa-airlift",
    scenarioId: mockScenario.id,
    factionId: "faction-usa",
    kind: "military_signal",
    title: "Expand airlift operations",
    summary: "Demonstrate resolve through logistics rather than direct force.",
    detail:
      "Raises operational pressure while preserving political clarity about defensive intent.",
    visibility: "public",
    requirementTags: ["briefing"],
    consequenceHints: ["higher-risk", "credibility"],
    recommendationPercent: 68,
    metadata: {}
  },
  {
    id: "option-usa-backchannel",
    scenarioId: mockScenario.id,
    factionId: "faction-usa",
    kind: "intelligence",
    title: "Use a quiet diplomatic channel",
    summary: "Test for concessions privately while keeping public posture steady.",
    detail:
      "Can reveal useful intent, but may cost time if the opponent is only probing resolve.",
    visibility: "private",
    requirementTags: ["briefing"],
    consequenceHints: ["intelligence-gain", "uncertain-yield"],
    recommendationPercent: 57,
    metadata: {}
  }
];

const mockPrivatePlayerState: PrivatePlayerState = {
  gameId: "mock-game-1",
  playerId: "player-1",
  factionId: "faction-usa",
  turnNumber: 3,
  privateBriefing:
    "Signals intelligence suggests the opponent expects another rhetorical response rather than a visible operational move.",
  intelligence: [
    "Allied governments will support symbolic firmness but are anxious about direct confrontation.",
    "Unofficial intermediaries are prepared to relay proposals within the next turn window."
  ],
  hiddenTracks: {
    allianceConfidence: 64,
    domesticPressure: 52,
    intelligenceClarity: 58
  },
  secretFlags: ["backchannel-open", "hawks-restless"],
  visibleOptionIds: mockOptions.map((option) => option.id),
  metadata: {}
};

const mockTurnHistory: TurnResolution[] = [
  {
    id: "resolution-1",
    gameId: "mock-game-1",
    turnNumber: 1,
    actionId: "action-1",
    status: "resolved",
    appliedOptionId: "option-setup",
    actingFactionId: "faction-ussr",
    publicSummary:
      "Administrative restrictions around Berlin tightened, sharpening the stakes without open force.",
    privateSummaries: [
      {
        playerId: "player-1",
        factionId: "faction-usa",
        summary: "Initial intelligence suggests this is a test of Western tolerance.",
        tags: ["intelligence", "setup"]
      }
    ],
    effects: ["pressure-up", "attention-up"],
    updatedTracks: {
      diplomaticPressure: 52,
      militaryPosture: 37
    },
    escalated: false,
    llmNarrative: {
      headline: "Restrictions harden the opening move",
      publicSummary:
        "Officials on both sides frame the move as limited, but observers increasingly view it as the start of a wider contest.",
      privateUpdates: [
        {
          factionId: "faction-usa",
          summary: "Regional reporting indicates the move was planned to probe coalition resolve.",
          tags: ["intel"]
        }
      ],
      consequenceTags: ["pressure", "opening"],
      followupHooks: ["response-window"],
      metadata: {}
    },
    resolvedAt: "2026-03-28T18:10:00.000Z",
    metadata: {}
  },
  {
    id: "resolution-2",
    gameId: "mock-game-1",
    turnNumber: 2,
    actionId: "action-2",
    status: "resolved",
    appliedOptionId: "option-reassure-allies",
    actingFactionId: "faction-usa",
    publicSummary:
      "Western leadership coordinated a visible diplomatic response and reassured allied capitals.",
    privateSummaries: [
      {
        playerId: "player-1",
        factionId: "faction-usa",
        summary: "Alliance confidence improved, but domestic critics called the move too cautious.",
        tags: ["allies", "politics"]
      }
    ],
    effects: ["alliance-confidence-up"],
    updatedTracks: {
      diplomaticPressure: 56,
      militaryPosture: 40
    },
    escalated: false,
    llmNarrative: {
      headline: "The West signals cohesion",
      publicSummary:
        "The response was measured, but it reduced immediate uncertainty about coalition alignment.",
      privateUpdates: [],
      consequenceTags: ["cohesion"],
      followupHooks: ["next-turn-choice"],
      metadata: {}
    },
    resolvedAt: "2026-03-28T18:45:00.000Z",
    metadata: {}
  }
];

const mockAdvisorAnswer: AdvisorAnswer = {
  answerId: "advisor-1",
  gameId: "mock-game-1",
  turnNumber: 3,
  perspectiveFactionId: "faction-usa",
  summary:
    "A visible but bounded operational move currently offers the best balance of credibility and restraint.",
  rationale: [
    "Alliance cohesion is strong enough to absorb a firmer signal.",
    "Purely rhetorical responses risk confirming the opponent's assumptions.",
    "A private channel still remains available next turn if tensions stabilize."
  ],
  recommendationBand: "medium",
  recommendedOptionIds: ["option-usa-airlift"],
  confidencePercent: 68,
  riskNotes: [
    "Escalation risk rises if the opponent mirrors the signal with a harder posture.",
    "Domestic expectations may continue to climb after a visible move."
  ],
  assumptions: [
    "The current crisis remains bounded to access and signaling issues.",
    "No hidden military surprise is triggered this turn."
  ],
  metadata: {}
};

export const mockGame: Game = {
  id: "mock-game-1",
  scenarioId: mockScenario.id,
  mode: "solo",
  status: "in_progress",
  turnNumber: 3,
  phase: "briefing",
  currentFactionId: "faction-usa",
  players: [
    {
      id: "player-1",
      gameId: "mock-game-1",
      name: "Player One",
      role: "human",
      factionId: "faction-usa",
      seat: 0,
      isActive: true,
      createdAt: now,
      metadata: {}
    },
    {
      id: "player-2",
      gameId: "mock-game-1",
      name: "Soviet Bloc AI",
      role: "ai",
      factionId: "faction-ussr",
      seat: 1,
      isActive: true,
      createdAt: now,
      metadata: {
        generated: true
      }
    }
  ],
  factions: mockFactions,
  publicState: {
    gameId: "mock-game-1",
    scenarioId: mockScenario.id,
    turnNumber: 3,
    activeFactionId: "faction-usa",
    phase: "briefing",
    worldTension: 57,
    publicNarrative:
      "The crisis has entered a sharper phase. Public statements remain measured, but each side is now treating the next move as a signal of long-term resolve.",
    headline: "Resolve is becoming the story of the crisis",
    visibleTracks: {
      diplomaticPressure: 61,
      militaryPosture: 47,
      globalAttention: 71
    },
    publicFlags: ["high-attention", "signal-contest"],
    revealedEvents: ["checkpoint-restrictions", "allied-consultations"],
    availableOptions: mockOptions,
    updatedAt: now,
    metadata: {}
  },
  privatePlayerStates: [mockPrivatePlayerState],
  derivedState: {
    gameId: "mock-game-1",
    turnNumber: 3,
    actingPlayerIds: ["player-1"],
    legalActionIds: mockOptions.map((option) => option.id),
    recommendedActionIds: ["option-usa-airlift"],
    escalationRiskPercent: 43,
    negotiationLeverage: {
      "faction-usa": 56,
      "faction-ussr": 48
    },
    factionMomentum: {
      "faction-usa": 54,
      "faction-ussr": 49
    },
    warnings: [
      "Operational signaling will be read as long-term intent, not a one-off gesture."
    ],
    metadata: {}
  },
  availableOptions: mockOptions,
  advisorAnswers: [mockAdvisorAnswer],
  lastResolution: mockTurnHistory[mockTurnHistory.length - 1],
  createdAt: "2026-03-28T17:40:00.000Z",
  updatedAt: now,
  metadata: {
    scenarioSlug: mockScenario.slug
  }
};

export function getMockGameById(gameId: string): Game | null {
  return gameId === mockGame.id ? mockGame : null;
}

export function getMockTurnHistory(gameId: string): TurnResolution[] {
  return gameId === mockGame.id ? mockTurnHistory : [];
}

export function getMockAdvisorAnswer(gameId: string): AdvisorAnswer | null {
  return gameId === mockGame.id ? mockAdvisorAnswer : null;
}

export function getPrivateStateForPlayer(gameId: string): PrivatePlayerState | null {
  return gameId === mockGame.id ? mockPrivatePlayerState : null;
}
