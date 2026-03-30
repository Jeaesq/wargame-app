import type {
  AdvisorResponsePayload,
  ChoiceOption,
  Game,
  ScenarioDefinition,
  TargetGameLength,
  TurnAction,
  TurnGenerationArtifacts
} from "@wargame/shared";
import type { AdvisorVisibleContext } from "../repositories/contracts.js";
import type {
  AdvisorResponseProviderInput,
  TurnGenerationProviderInput
} from "../providers/types.js";
import { projectSessionForSelection } from "../repositories/session-visibility-projection.js";

export type AdvisorEvalFixture = {
  id: string;
  name: string;
  input: AdvisorResponseProviderInput;
  expectations: {
    allowedOptionIds: string[];
    forbiddenTerms: string[];
    topicalTerms: string[];
    maxRecommendedOptionCount: number;
  };
};

export type TurnEvalFixture = {
  id: string;
  name: string;
  input: TurnGenerationProviderInput;
  expectations: {
    allowedNextOptionIds: string[];
    allowedPrivateFactionIds: string[];
    allowedPrivatePlayerIds: string[];
    forbiddenTerms: string[];
    topicalTerms: string[];
  };
};

function createScenario(): ScenarioDefinition {
  return {
    id: "scenario-cold-war-berlin-mvp",
    slug: "cold-war-berlin-mvp",
    title: "Berlin Airlift Crisis",
    description: "A constrained Cold War crisis.",
    historicalFrame: "1948 Berlin blockade tensions.",
    complexity: "standard",
    supportedModes: ["solo", "hotseat", "head_to_head"],
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
        publicTraits: ["airlift", "alliance"],
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
        doctrineSummary: "Maintain pressure without triggering direct war.",
        publicTraits: ["pressure", "coercion"],
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
        publicNarrative: "Soviet restrictions are tightening pressure on access to Berlin.",
        worldTension: 58,
        visibleTracks: {},
        publicFlags: ["blockade"],
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
    choiceCatalog: [
      {
        id: "option-usa-airlift-expand",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        kind: "diplomatic",
        title: "Expand the airlift",
        summary: "Increase flights while avoiding direct military contact.",
        visibility: "public",
        requirementTags: ["airlift-ready"],
        consequenceHints: ["Shows resolve", "May raise tension modestly"],
        recommendationPercent: 69,
        metadata: {}
      },
      {
        id: "option-usa-public-warning",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        kind: "propaganda",
        title: "Issue a public warning",
        summary: "Publicly condemn the blockade and demand access restoration.",
        visibility: "public",
        requirementTags: [],
        consequenceHints: ["Signals resolve", "Raises public expectations"],
        recommendationPercent: 54,
        metadata: {}
      },
      {
        id: "option-usa-fighter-escort",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        kind: "military_signal",
        title: "Escort the airlift with fighters",
        summary: "Provide visible military cover for the next airlift wave.",
        visibility: "public",
        requirementTags: ["high-readiness"],
        consequenceHints: ["Strong deterrent signal", "Sharp escalation risk"],
        recommendationPercent: 31,
        metadata: {}
      },
      {
        id: "option-ussr-tighten-checkpoints",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-ussr",
        kind: "diplomatic",
        title: "Tighten checkpoint inspections",
        summary: "Increase procedural pressure without openly widening the blockade.",
        visibility: "public",
        requirementTags: [],
        consequenceHints: ["Sustains pressure", "Preserves deniability"],
        recommendationPercent: 63,
        metadata: {}
      },
      {
        id: "option-ussr-offer-talks",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-ussr",
        kind: "diplomatic",
        title: "Offer technical talks",
        summary: "Propose limited talks to slow allied political momentum.",
        visibility: "public",
        requirementTags: [],
        consequenceHints: ["Buys time", "Signals flexibility"],
        recommendationPercent: 58,
        metadata: {}
      }
    ],
    metadata: {}
  };
}

function createPublicState(overrides: Partial<Game["state"]["public"]>): Game["state"]["public"] {
  return {
    gameId: "game-eval",
    scenarioId: "scenario-cold-war-berlin-mvp",
    turnNumber: 3,
    activeFactionId: "faction-usa",
    phase: "briefing",
    headline: "Berlin access under pressure",
    publicNarrative: "Supply flights continue under mounting international strain.",
    worldTension: 58,
    visibleTracks: {
      alliedResolve: 64
    },
    publicFlags: ["blockade"],
    revealedEvents: ["airlift_expanded"],
    updatedAt: "1948-07-04T00:00:00.000Z",
    metadata: {},
    ...overrides
  };
}

function createContext(input: {
  factionId: string;
  turnNumber: number;
  publicState: Game["state"]["public"];
  visibleOptions: ChoiceOption[];
  visibleWarnings: string[];
  question?: string;
}): AdvisorVisibleContext {
  return {
    gameId: "game-eval",
    turnNumber: input.turnNumber,
    factionId: input.factionId,
    playerId: input.factionId === "faction-usa" ? "player-usa" : "player-ussr",
    publicState: input.publicState,
    visibleOptions: input.visibleOptions,
    visibleWarnings: input.visibleWarnings,
    lastAdvisorAnswer: null
  };
}

function createGame(input: {
  turnNumber: number;
  currentFactionId: string;
  publicState: Game["state"]["public"];
  usaOptions: ChoiceOption[];
  ussrOptions: ChoiceOption[];
  targetGameLength: TargetGameLength;
}): Game {
  const scenario = createScenario();

  return {
    id: "game-eval",
    scenarioId: scenario.id,
    ownerUserId: "local-dev-user",
    mode: "head_to_head",
    status: "in_progress",
    turnNumber: input.turnNumber,
    phase: "briefing",
    currentFactionId: input.currentFactionId,
    players: [
      {
        id: "player-usa",
        gameId: "game-eval",
        name: "Player USA",
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
        gameId: "game-eval",
        name: "Player USSR",
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
      public: input.publicState,
      privateByPlayer: [
        {
          gameId: "game-eval",
          playerId: "player-usa",
          factionId: "faction-usa",
          turnNumber: input.turnNumber,
          privateBriefing: "Keep Berlin supplied without triggering open conflict.",
          intelligence: ["Checkpoint harassment is rising but Soviet air interception remains limited."],
          hiddenTracks: {},
          secretFlags: ["airlift-ready"],
          availableOptions: input.usaOptions,
          metadata: {}
        },
        {
          gameId: "game-eval",
          playerId: "player-ussr",
          factionId: "faction-ussr",
          turnNumber: input.turnNumber,
          privateBriefing: "Sustain pressure while keeping allied escalation options politically costly.",
          intelligence: ["Western resolve is solid but politically sensitive."],
          hiddenTracks: {},
          secretFlags: ["checkpoint-control"],
          availableOptions: input.ussrOptions,
          metadata: {}
        }
      ],
      derived: {
        gameId: "game-eval",
        turnNumber: input.turnNumber,
        actingPlayerIds:
          input.currentFactionId === "faction-usa" ? ["player-usa"] : ["player-ussr"],
        legalActionIds:
          input.currentFactionId === "faction-usa"
            ? input.usaOptions.map((option) => option.id)
            : input.ussrOptions.map((option) => option.id),
        recommendedActionIds:
          input.currentFactionId === "faction-usa"
            ? input.usaOptions
                .filter((option) => (option.recommendationPercent ?? 0) >= 60)
                .map((option) => option.id)
            : input.ussrOptions
                .filter((option) => (option.recommendationPercent ?? 0) >= 60)
                .map((option) => option.id),
        escalationRiskPercent: 55,
        negotiationLeverage: {},
        factionMomentum: {},
        warnings:
          input.currentFactionId === "faction-usa"
            ? ["Public resolve is being tested."]
            : ["A heavy-handed move may stiffen allied resolve."],
        metadata: {}
      }
    },
    advisorAnswers: [],
    lastResolution: null,
    createdAt: "1948-06-24T00:00:00.000Z",
    updatedAt: "1948-07-04T00:00:00.000Z",
    sessionConfig: {
      targetGameLength: input.targetGameLength
    },
    metadata: {}
  };
}

export function createAdvisorEvalFixtures(): AdvisorEvalFixture[] {
  const scenario = createScenario();
  const expandAirlift = scenario.choiceCatalog[0]!;
  const publicWarning = scenario.choiceCatalog[1]!;
  const fighterEscort = scenario.choiceCatalog[2]!;

  return [
    {
      id: "advisor-berlin-best-visible-move",
      name: "Advisor recommends a realistic visible move under pressure",
      input: {
        scenario,
        targetGameLength: "medium",
        question: "What is the best visible move for the United States right now?",
        context: createContext({
          factionId: "faction-usa",
          turnNumber: 3,
          publicState: createPublicState({
            turnNumber: 3,
            worldTension: 58
          }),
          visibleOptions: [expandAirlift, publicWarning, fighterEscort],
          visibleWarnings: ["Public resolve is being tested."]
        })
      },
      expectations: {
        allowedOptionIds: [
          expandAirlift.id,
          publicWarning.id,
          fighterEscort.id
        ],
        forbiddenTerms: [
          "secret",
          "classified",
          "intercepted signal",
          "backend",
          "not shown"
        ],
        topicalTerms: ["airlift", "berlin", "tension", "warning"],
        maxRecommendedOptionCount: 2
      }
    },
    {
      id: "advisor-berlin-risk-question",
      name: "Advisor answers a visibility-bounded risk question at elevated tension",
      input: {
        scenario,
        targetGameLength: "long",
        question: "How risky would it be to escort the airlift with fighters?",
        context: createContext({
          factionId: "faction-usa",
          turnNumber: 5,
          publicState: createPublicState({
            turnNumber: 5,
            worldTension: 71,
            headline: "Airlift pressure nears a breaking point",
            publicNarrative: "Berlin remains supplied, but every visible signal is being watched for escalation."
          }),
          visibleOptions: [expandAirlift, fighterEscort],
          visibleWarnings: [
            "A visible military signal could harden Soviet responses.",
            "Escalation pressure is elevated."
          ]
        })
      },
      expectations: {
        allowedOptionIds: [expandAirlift.id, fighterEscort.id],
        forbiddenTerms: [
          "secret",
          "classified",
          "intercepted",
          "backchannel proof",
          "backend"
        ],
        topicalTerms: ["fighters", "airlift", "risk", "tension", "escalation"],
        maxRecommendedOptionCount: 2
      }
    }
  ];
}

export function createTurnEvalFixtures(): TurnEvalFixture[] {
  const scenario = createScenario();
  const expandAirlift = scenario.choiceCatalog[0]!;
  const fighterEscort = scenario.choiceCatalog[2]!;
  const tightenCheckpoints = scenario.choiceCatalog[3]!;
  const offerTalks = scenario.choiceCatalog[4]!;

  const diplomaticPublicState = createPublicState({
    turnNumber: 3,
    activeFactionId: "faction-usa",
    worldTension: 58,
    publicNarrative: "Supply flights continue under mounting international strain."
  });
  const militaryPublicState = createPublicState({
    turnNumber: 6,
    activeFactionId: "faction-usa",
    worldTension: 74,
    headline: "Berlin air corridors become a visible test of resolve",
    publicNarrative: "Any military signal now carries outsized escalation risk.",
    visibleTracks: {
      alliedResolve: 71
    }
  });

  const diplomaticGame = createGame({
    turnNumber: 3,
    currentFactionId: "faction-usa",
    publicState: diplomaticPublicState,
    usaOptions: [expandAirlift, fighterEscort],
    ussrOptions: [tightenCheckpoints, offerTalks],
    targetGameLength: "medium"
  });
  const militaryGame = createGame({
    turnNumber: 6,
    currentFactionId: "faction-usa",
    publicState: militaryPublicState,
    usaOptions: [expandAirlift, fighterEscort],
    ussrOptions: [tightenCheckpoints, offerTalks],
    targetGameLength: "long"
  });

  const diplomaticAction: TurnAction = {
    id: "action-diplomatic-1",
    gameId: diplomaticGame.id,
    turnNumber: diplomaticGame.turnNumber,
    playerId: "player-usa",
    factionId: "faction-usa",
    optionId: expandAirlift.id,
    kind: expandAirlift.kind,
    submittedAt: "1948-07-04T00:00:00.000Z",
    declaredIntent: "Demonstrate resolve while avoiding direct military contact.",
    parameters: {},
    clientContext: {}
  };
  const militaryAction: TurnAction = {
    id: "action-military-1",
    gameId: militaryGame.id,
    turnNumber: militaryGame.turnNumber,
    playerId: "player-usa",
    factionId: "faction-usa",
    optionId: fighterEscort.id,
    kind: fighterEscort.kind,
    submittedAt: "1948-07-10T00:00:00.000Z",
    declaredIntent: "Deter harassment through a visible military signal.",
    parameters: {},
    clientContext: {}
  };

  return [
    {
      id: "turn-berlin-airlift-diplomatic",
      name: "Turn narration for a measured airlift expansion",
      input: {
        game: diplomaticGame,
        publicView: projectSessionForSelection(diplomaticGame, { view: "public" }),
        actingFactionView: projectSessionForSelection(diplomaticGame, {
          playerId: "player-usa",
          factionId: "faction-usa",
          view: "faction"
        }),
        scenario,
        targetGameLength: "medium",
        action: diplomaticAction,
        actingPlayer: diplomaticGame.players[0]!,
        actingPrivateState: diplomaticGame.state.privateByPlayer[0]!,
        selectedOption: expandAirlift,
        nextFactionId: "faction-ussr",
        nextTurnNumber: 4,
        tensionDelta: 4,
        nextWorldTension: 62,
        nextOptions: [tightenCheckpoints, offerTalks]
      },
      expectations: {
        allowedNextOptionIds: [tightenCheckpoints.id, offerTalks.id],
        allowedPrivateFactionIds: ["faction-usa"],
        allowedPrivatePlayerIds: ["player-usa"],
        forbiddenTerms: ["secret soviet order", "backend", "hidden rule", "off-screen coup"],
        topicalTerms: ["airlift", "berlin", "pressure", "checkpoint", "talks"]
      }
    },
    {
      id: "turn-berlin-fighter-escort",
      name: "Turn narration for a sharp military signal at high tension",
      input: {
        game: militaryGame,
        publicView: projectSessionForSelection(militaryGame, { view: "public" }),
        actingFactionView: projectSessionForSelection(militaryGame, {
          playerId: "player-usa",
          factionId: "faction-usa",
          view: "faction"
        }),
        scenario,
        targetGameLength: "long",
        action: militaryAction,
        actingPlayer: militaryGame.players[0]!,
        actingPrivateState: militaryGame.state.privateByPlayer[0]!,
        selectedOption: fighterEscort,
        nextFactionId: "faction-ussr",
        nextTurnNumber: 7,
        tensionDelta: 12,
        nextWorldTension: 86,
        nextOptions: [tightenCheckpoints, offerTalks]
      },
      expectations: {
        allowedNextOptionIds: [tightenCheckpoints.id, offerTalks.id],
        allowedPrivateFactionIds: ["faction-usa"],
        allowedPrivatePlayerIds: ["player-usa"],
        forbiddenTerms: ["secret soviet order", "backend", "automatic victory", "war already started"],
        topicalTerms: ["fighters", "escort", "airlift", "escalation", "berlin"]
      }
    }
  ];
}

export function createLeakyAdvisorCandidate(
  fixture: AdvisorEvalFixture
): AdvisorResponsePayload {
  return {
    summary: "Secret intelligence proves the Soviets will blink, so escalate now.",
    shortAnswer: "Use the classified opening and push harder.",
    rationale: [
      "An intercepted signal confirms hidden Soviet weakness."
    ],
    recommendationBand: "high",
    confidenceLabel: "high",
    recommendedOptionIds: [
      fixture.expectations.allowedOptionIds[0] ?? "unknown",
      "option-not-visible"
    ],
    confidencePercent: 88,
    riskNotes: ["Risk is low because of what we secretly know."],
    assumptions: ["Backend data confirms this path."],
    metadata: {}
  };
}

export function createImplausibleTurnCandidate(
  fixture: TurnEvalFixture
): TurnGenerationArtifacts {
  return {
    publicSummary: "The situation remains fluid.",
    privateSummaries: [
      {
        playerId: "player-ussr",
        factionId: "faction-ussr",
        summary: "A secret off-screen order changes everything.",
        tags: ["leak"]
      }
    ],
    effects: ["magic"],
    recommendationLabels: ["generic"],
    riskLabels: [],
    recommendedNextOptionIds: ["option-not-visible"],
    worldUpdateSuggestions: [
      {
        key: "worldTension",
        direction: "decrease",
        magnitude: "high",
        rationale: "Because everything is calm now."
      }
    ],
    llmNarrative: {
      headline: "Automatic victory",
      publicSummary: "Everything is resolved off-screen.",
      privateUpdates: [
        {
          factionId: "faction-ussr",
          summary: "Hidden rule change.",
          tags: ["leak"]
        }
      ],
      consequenceTags: ["generic"],
      followupHooks: [],
      metadata: {}
    },
    metadata: {}
  };
}
