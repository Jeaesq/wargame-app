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
      requirementTags: ["airlift-ready"],
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

const game: Game = {
  id: "game-1",
  scenarioId: scenario.id,
  ownerUserId: "local-dev-user",
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
      userId: "local-dev-user",
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
    }
  },
  progression: {
    model: "solo_round",
    currentRound: 1,
    currentRoundActionIndex: 1,
    roundActionCount: 2,
    completedRoundCount: 0
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

test("advisor prompt includes explicit visibility and evidence boundaries", () => {
  const prompt = buildOpenAIAdvisorPrompt({
    scenario,
    targetGameLength: "medium",
    question: "What should we do next?",
    context
  });

  assert.match(prompt.instructions, /Answer only from player-visible information/i);
  const parsed = JSON.parse(prompt.prompt) as {
    visibleState: {
      visibleOptionIds: string[];
      visibleOutcome: { status: string };
      likelyOpponentFactionId: string | null;
      privateBriefing: string | null;
      visibleIntelligence: string[];
      strategicAssessment: { doctrineLabel: string };
      likelyOpponentAssessment: { doctrineLabel: string };
      advisorFraming: {
        roundLabel: string | null;
        pacingWindow: string;
        optionComparisons: Array<{ optionId: string; doctrineFit: string }>;
      };
    };
    answerRequirements: {
      assumptions: string;
      rationale: string;
      recommendedOptionIds: string;
    };
    rules: string[];
  };

  assert.deepEqual(parsed.visibleState.visibleOptionIds, ["option-1"]);
  assert.equal(parsed.visibleState.visibleOutcome.status, "ongoing");
  assert.equal(parsed.visibleState.likelyOpponentFactionId, "faction-ussr");
  assert.match(parsed.visibleState.privateBriefing ?? "", /direct clash/i);
  assert.deepEqual(parsed.visibleState.visibleIntelligence, [
    "Soviet pressure is steady but not yet absolute."
  ]);
  assert.equal(parsed.visibleState.strategicAssessment.doctrineLabel, "measured resolve");
  assert.equal(
    parsed.visibleState.likelyOpponentAssessment.doctrineLabel,
    "coercive leverage below the threshold of war"
  );
  assert.equal(parsed.visibleState.advisorFraming.roundLabel, "Round 1");
  assert.equal(parsed.visibleState.advisorFraming.pacingWindow, "opening");
  assert.equal(parsed.visibleState.advisorFraming.optionComparisons[0]?.optionId, "option-1");
  assert.equal(parsed.visibleState.advisorFraming.optionComparisons[0]?.doctrineFit, "strong");
  assert.match(parsed.answerRequirements.assumptions, /Use this only for cautious inference/i);
  assert.match(parsed.answerRequirements.rationale, /compare the leading option/i);
  assert.match(parsed.answerRequirements.recommendedOptionIds, /Prefer one to two ids/i);
  assert.ok(
    parsed.rules.some((rule) => /Distinguish known facts from inference/i.test(rule))
  );
  assert.ok(
    parsed.rules.some((rule) => /Faction-visible private briefing and intelligence/i.test(rule))
  );
  assert.ok(parsed.rules.some((rule) => /advisorFraming is backend-authored/i.test(rule)));
  assert.ok(
    parsed.rules.some((rule) => /leading visible option beats at least one visible alternative/i.test(rule))
  );
  assert.ok(
    parsed.rules.some((rule) => /Keep recommendations actionable/i.test(rule))
  );
});

test("turn prompt includes authorized private context and stable next-option constraints", () => {
  const prompt = buildOpenAITurnGenerationPrompt({
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
        effectProfile: neutralEffectProfile,
        metadata: {}
      }
    ]
  });

  assert.match(prompt.instructions, /canonical action, legal moves, turn order/i);
  const parsed = JSON.parse(prompt.prompt) as {
    scenario: { publicObjectives: Array<{ factionId: string }> };
    publicState: { outcomePressure: { maturityPercent: number } };
    nextTurnContext: { visibleNextOptions: Array<{ category: string }> };
    authorizedPrivateContext: { factionId: string; intelligence: string[] };
    outputRequirements: {
      recommendedNextOptionIds: string;
      recommendedOptionNotes: string;
    };
    rules: string[];
  };

  assert.equal(parsed.scenario.publicObjectives[0]?.factionId, "faction-usa");
  assert.equal(parsed.publicState.outcomePressure.maturityPercent, 10);
  assert.equal(parsed.nextTurnContext.visibleNextOptions[0]?.category, "diplomatic");
  assert.equal(parsed.authorizedPrivateContext.factionId, "faction-usa");
  assert.deepEqual(parsed.authorizedPrivateContext.intelligence, [
    "Soviet pressure is steady but not yet absolute."
  ]);
  assert.match(
    parsed.outputRequirements.recommendedNextOptionIds,
    /Only option ids from visibleNextOptions/i
  );
  assert.match(
    parsed.outputRequirements.recommendedOptionNotes,
    /Zero to three concise notes/i
  );
  assert.ok(
    parsed.rules.some((rule) => /Do not leak or invent private facts for other factions/i.test(rule))
  );
  assert.ok(
    parsed.rules.some((rule) => /category variety/i.test(rule))
  );
});
