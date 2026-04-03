import assert from "node:assert/strict";
import test from "node:test";
import type { Game } from "@wargame/shared";
import { buildVisibleAdvisorFraming, scoreAdvisorComparison } from "./advisor-framing-service.js";

const baseGame: Game = {
  id: "game-1",
  scenarioId: "scenario-cold-war-berlin-mvp",
  ownerUserId: "user-1",
  mode: "solo",
  status: "in_progress",
  turnNumber: 2,
  phase: "action_selection",
  currentFactionId: "faction-usa",
  players: [
    {
      id: "player-1",
      gameId: "game-1",
      name: "Player One",
      role: "human",
      userId: "user-1",
      factionId: "faction-usa",
      seat: 0,
      isActive: true,
      createdAt: "1948-06-24T00:00:00.000Z",
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
  state: {
    public: {
      gameId: "game-1",
      scenarioId: "scenario-cold-war-berlin-mvp",
      turnNumber: 2,
      activeFactionId: "faction-usa",
      phase: "action_selection",
      headline: "Berlin access under pressure",
      publicNarrative: "Supply routes are contested.",
      worldTension: 74,
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
        turnNumber: 2,
        privateBriefing: "Hold access while avoiding a direct clash.",
        intelligence: ["Soviet pressure is steady but not yet absolute."],
        hiddenTracks: {},
        secretFlags: [],
        availableOptions: [
          {
            id: "option-backchannel",
            scenarioId: "scenario-cold-war-berlin-mvp",
            factionId: "faction-usa",
            title: "Open a backchannel",
            summary: "Search for a diplomatic off-ramp.",
            kind: "diplomatic",
            visibility: "public",
            requirementTags: [],
            consequenceHints: ["Lowers pressure"],
            recommendationPercent: 62,
            effectProfile: {
              worldTensionDelta: -4,
              escalationRiskDelta: -8,
              visibleTrackDeltas: {},
              negotiationLeverageDeltas: {},
              factionMomentumDeltas: {},
              publicFlagAdds: [],
              publicFlagRemoves: [],
              revealedEventAdds: [],
              warningAdds: []
            },
            metadata: {}
          },
          {
            id: "option-protest",
            scenarioId: "scenario-cold-war-berlin-mvp",
            factionId: "faction-usa",
            title: "Issue a public protest",
            summary: "Increase public pressure on the blockade.",
            kind: "propaganda",
            visibility: "public",
            requirementTags: [],
            consequenceHints: ["Shows resolve"],
            recommendationPercent: 64,
            effectProfile: {
              worldTensionDelta: 4,
              escalationRiskDelta: 6,
              visibleTrackDeltas: {},
              negotiationLeverageDeltas: {},
              factionMomentumDeltas: {},
              publicFlagAdds: [],
              publicFlagRemoves: [],
              revealedEventAdds: [],
              warningAdds: []
            },
            metadata: {}
          }
        ],
        metadata: {}
      }
    ],
    derived: {
      gameId: "game-1",
      turnNumber: 2,
      actingPlayerIds: ["player-1"],
      legalActionIds: ["option-backchannel", "option-protest"],
      recommendedActionIds: ["option-protest"],
      escalationRiskPercent: 78,
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
          maturityPercent: 62,
          decisiveOutcomePercent: 58,
          deescalationOpportunityPercent: 73,
          catastrophicRiskPercent: 81
        },
        publicObjectiveProgress: {
          "faction-usa": 48,
          "faction-ussr": 57
        },
        metadata: {}
      },
      warnings: ["Checkpoint pressure is hardening."],
      metadata: {}
    }
  },
  progression: {
    model: "solo_round",
    currentRound: 2,
    currentRoundActionIndex: 1,
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

test("advisor framing summarizes visible pacing and sorts options by pressure-aware fit", () => {
  const visibleOptions = baseGame.state.privateByPlayer[0]!.availableOptions;
  const framing = buildVisibleAdvisorFraming({
    game: baseGame,
    factionId: "faction-usa",
    strategicAssessment: {
      doctrineLabel: "measured resolve",
      preferredCategories: ["diplomatic", "intelligence"],
      cautiousCategories: ["military"],
      scenarioFocus: "superpower signaling and allied credibility in Berlin",
      ownObjectivePressure: 48,
      rivalObjectivePressure: 57,
      escalationRiskPercent: 78,
      worldTension: 74,
      strategicPosture: "recover",
      visiblePriority:
        "Visible objective pressure is slipping, so measured resolve should recover leverage before the round hardens."
    },
    likelyOpponentAssessment: {
      doctrineLabel: "coercive leverage below the threshold of war",
      preferredCategories: ["economic", "military", "diplomatic"],
      cautiousCategories: ["military"],
      scenarioFocus: "pressure and bargaining leverage in Berlin",
      ownObjectivePressure: 57,
      rivalObjectivePressure: 48,
      escalationRiskPercent: 78,
      worldTension: 74,
      strategicPosture: "protect",
      visiblePriority:
        "The opposing side can protect its edge by keeping coercive pressure below the threshold of war."
    },
    visibleOptions
  });

  assert.equal(framing.roundLabel, "Round 2");
  assert.equal(framing.pacingWindow, "midgame");
  assert.match(framing.pacingSummary, /Round 2 is in the midgame phase/i);
  assert.match(framing.pressureSummary, /catastrophic risk is 81%/i);
  assert.equal(framing.optionComparisons[0]?.optionId, "option-backchannel");
  assert.equal(framing.optionComparisons[0]?.pressureRole, "deescalate");
  assert.equal(framing.optionComparisons[0]?.doctrineFit, "strong");
});

test("advisor comparison scoring rewards visible off-ramp options when pressure is severe", () => {
  const deescalatoryScore = scoreAdvisorComparison({
    comparison: {
      optionId: "option-backchannel",
      title: "Open a backchannel",
      doctrineFit: "strong",
      pressureRole: "deescalate",
      rationale: "Backchannel fits doctrine and lowers pressure.",
      riskSummary: "It may concede short-term initiative."
    },
    visibleOutcome: baseGame.state.derived.outcome,
    recommendationPercent: 62
  });
  const pressureScore = scoreAdvisorComparison({
    comparison: {
      optionId: "option-protest",
      title: "Issue a public protest",
      doctrineFit: "situational",
      pressureRole: "accelerate",
      rationale: "Protest adds pressure.",
      riskSummary: "It can narrow later off-ramps."
    },
    visibleOutcome: baseGame.state.derived.outcome,
    recommendationPercent: 64
  });

  assert.ok(deescalatoryScore > pressureScore);
});
