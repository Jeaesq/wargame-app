import assert from "node:assert/strict";
import test from "node:test";
import type { AdvisorVisibleContext } from "../../repositories/contracts.js";
import { MockAdvisorResponseProvider } from "./mock-advisor-response-provider.js";

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

function createContext(): AdvisorVisibleContext {
  return {
    gameId: "game-1",
    turnNumber: 3,
    factionId: "faction-usa",
    playerId: "player-1",
    likelyOpponentFactionId: "faction-ussr",
    publicState: {
      gameId: "game-1",
      scenarioId: "scenario-cold-war-berlin-mvp",
      turnNumber: 3,
      activeFactionId: "faction-usa",
      phase: "action_selection",
      headline: "Berlin access under pressure",
      publicNarrative: "Supply routes are contested and public signaling matters.",
      worldTension: 68,
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
        maturityPercent: 58,
        decisiveOutcomePercent: 56,
        deescalationOpportunityPercent: 62,
        catastrophicRiskPercent: 71
      },
      publicObjectiveProgress: {
        "faction-usa": 49,
        "faction-ussr": 54
      },
      metadata: {}
    },
    visibleOptions: [
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
        recommendationPercent: 63,
        effectProfile: {
          ...neutralEffectProfile,
          worldTensionDelta: -4,
          escalationRiskDelta: -6
        },
        metadata: {}
      },
      {
        id: "option-protest",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        title: "Issue a public protest",
        summary: "Raise public pressure on the blockade.",
        kind: "propaganda",
        visibility: "public",
        requirementTags: [],
        consequenceHints: ["Shows resolve"],
        recommendationPercent: 60,
        effectProfile: {
          ...neutralEffectProfile,
          worldTensionDelta: 3,
          escalationRiskDelta: 4
        },
        metadata: {}
      },
      {
        id: "option-escort",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        title: "Escort the airlift with fighters",
        summary: "Pair the airlift with a visible military signal.",
        kind: "military_signal",
        visibility: "public",
        requirementTags: [],
        consequenceHints: ["Sharp escalation risk"],
        recommendationPercent: 36,
        effectProfile: {
          ...neutralEffectProfile,
          worldTensionDelta: 9,
          escalationRiskDelta: 12
        },
        metadata: {}
      }
    ],
    visibleWarnings: ["Escalation pressure is elevated."],
    privateBriefing: "Hold access while avoiding a direct clash.",
    visibleIntelligence: ["Soviet pressure is steady but not yet absolute."],
    strategicAssessment: {
      doctrineLabel: "measured resolve",
      preferredCategories: ["diplomatic", "intelligence"],
      cautiousCategories: ["military"],
      scenarioFocus: "superpower signaling and allied credibility in Berlin",
      ownObjectivePressure: 49,
      rivalObjectivePressure: 54,
      escalationRiskPercent: 68,
      worldTension: 68,
      strategicPosture: "recover",
      visiblePriority:
        "Visible objective pressure is slipping, so measured resolve should recover leverage before the round hardens."
    },
    likelyOpponentAssessment: {
      doctrineLabel: "coercive leverage below the threshold of war",
      preferredCategories: ["economic", "military", "diplomatic"],
      cautiousCategories: ["military"],
      scenarioFocus: "pressure and bargaining leverage in Berlin",
      ownObjectivePressure: 54,
      rivalObjectivePressure: 49,
      escalationRiskPercent: 68,
      worldTension: 68,
      strategicPosture: "protect",
      visiblePriority:
        "The opposing side can protect its edge by keeping coercive pressure below the threshold of war."
    },
    advisorFraming: {
      roundLabel: "Round 3",
      pacingWindow: "midgame",
      pacingSummary:
        "Round 3 is in the midgame phase, and a visible off-ramp is open if you can keep pressure under control.",
      pressureSummary:
        "Visible pressure favors restraint: de-escalation opportunity is 62% while catastrophic risk is 71%.",
      opponentSummary:
        "Likely opponent posture points toward coercive leverage below the threshold of war.",
      optionComparisons: [
        {
          optionId: "option-backchannel",
          title: "Open a backchannel",
          doctrineFit: "strong",
          pressureRole: "deescalate",
          rationale:
            "Open a backchannel fits the current doctrine well because it fits current doctrine, and it visibly lowers pressure.",
          riskSummary:
            "Visible downside: this choice may preserve flexibility but give up short-term initiative."
        },
        {
          optionId: "option-protest",
          title: "Issue a public protest",
          doctrineFit: "situational",
          pressureRole: "hold_line",
          rationale:
            "Issue a public protest is more situational than doctrinal, and it sustains pressure without forcing an immediate rupture.",
          riskSummary:
            "Visible downside: this choice adds pressure and could narrow later off-ramps."
        },
        {
          optionId: "option-escort",
          title: "Escort the airlift with fighters",
          doctrineFit: "risky",
          pressureRole: "accelerate",
          rationale:
            "Escort the airlift with fighters pushes beyond the doctrine's safer lane and it pushes the round toward a sharper outcome.",
          riskSummary:
            "Visible downside: this choice sits in a category your doctrine treats cautiously."
        }
      ]
    },
    lastAdvisorAnswer: null
  };
}

test("mock advisor compares visible options and recommends one to two ids for next-move questions", async () => {
  const provider = new MockAdvisorResponseProvider();
  const response = await provider.generateAdvisorResponse({
    scenario: {
      id: "scenario-cold-war-berlin-mvp",
      slug: "cold-war-berlin-mvp",
      title: "Berlin Airlift Crisis",
      description: "A constrained Cold War crisis.",
      historicalFrame: "1948 Berlin blockade tensions.",
      complexity: "standard",
      supportedModes: ["solo", "hotseat"],
      maxPlayers: 2,
      startingTurn: 1,
      objectives: [],
      factions: [],
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
            publicObjectiveProgress: {},
            metadata: {}
          },
          warnings: [],
          metadata: {}
        },
        initialOptions: []
      },
      choiceCatalog: [],
      metadata: {}
    },
    targetGameLength: "medium",
    question: "What should we do next?",
    context: createContext()
  });

  const payload = response as {
    shortAnswer: string;
    rationale: string[];
    recommendedOptionIds: string[];
    riskNotes: string[];
    recommendationBand: string;
  };

  assert.deepEqual(payload.recommendedOptionIds, ["option-backchannel", "option-protest"]);
  assert.match(payload.shortAnswer, /ahead of issue a public protest/i);
  assert.ok(payload.rationale.some((line) => /stronger than issue a public protest/i.test(line)));
  assert.ok(
    payload.riskNotes.some((line) => /narrow later off-ramps|preserve flexibility/i.test(line))
  );
  assert.equal(payload.recommendationBand, "high");
});

test("mock advisor avoids visible move recommendations for pure risk questions", async () => {
  const provider = new MockAdvisorResponseProvider();
  const response = await provider.generateAdvisorResponse({
    scenario: {
      id: "scenario-cold-war-berlin-mvp",
      slug: "cold-war-berlin-mvp",
      title: "Berlin Airlift Crisis",
      description: "A constrained Cold War crisis.",
      historicalFrame: "1948 Berlin blockade tensions.",
      complexity: "standard",
      supportedModes: ["solo", "hotseat"],
      maxPlayers: 2,
      startingTurn: 1,
      objectives: [],
      factions: [],
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
            publicObjectiveProgress: {},
            metadata: {}
          },
          warnings: [],
          metadata: {}
        },
        initialOptions: []
      },
      choiceCatalog: [],
      metadata: {}
    },
    targetGameLength: "long",
    question: "How risky would it be to escort the airlift with fighters?",
    context: createContext()
  });

  const payload = response as {
    recommendedOptionIds: string[];
    recommendationBand: string;
    shortAnswer: string;
  };

  assert.deepEqual(payload.recommendedOptionIds, []);
  assert.equal(payload.recommendationBand, "uncertain");
  assert.match(payload.shortAnswer, /risk/i);
});
