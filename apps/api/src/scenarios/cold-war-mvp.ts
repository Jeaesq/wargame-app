import { scenarioDefinitionSchema } from "@wargame/shared";

export function createColdWarMvpScenarioDefinition() {
  return scenarioDefinitionSchema.parse({
    id: "scenario-cold-war-berlin-mvp",
    slug: "cold-war-berlin-mvp",
    title: "Berlin Crisis MVP",
    description:
      "A focused Cold War confrontation built for early turn-based geopolitical playtesting.",
    historicalFrame:
      "An early Cold War Berlin-style crisis where public resolve, intelligence, and escalation management all matter.",
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
        description: "Western coalition managing deterrence and alliance credibility.",
        doctrineSummary: "Signal resolve, avoid uncontrolled escalation, preserve legitimacy.",
        publicTraits: ["alliance-network", "airlift-capability"],
        privateTraits: ["intel-coverage", "domestic-pressure"],
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
        description: "Eastern bloc leadership pressing for leverage without triggering open war.",
        doctrineSummary: "Apply pressure, preserve deterrence, exploit ambiguity.",
        publicTraits: ["regional-position", "coercive-leverage"],
        privateTraits: ["command-confidence", "covert-capability"],
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
          "A transport-access confrontation around Berlin is hardening into a wider diplomatic test.",
        headline: "Berlin access standoff intensifies",
        visibleTracks: {
          diplomaticPressure: 55,
          militaryPosture: 40,
          globalAttention: 60
        },
        publicFlags: ["berlin-crisis", "superpower-standoff"],
        revealedEvents: ["checkpoints-tightened"],
        metadata: {}
      },
      privateStates: [
        {
          factionId: "faction-usa",
          privateBriefing:
            "Allied cohesion is steady, but domestic hawks may punish visible weakness.",
          intelligence: [
            "Signals suggest Soviet planners expect a limited Western response.",
            "Backchannel partners remain open to quiet de-escalation."
          ],
          hiddenTracks: {
            allianceConfidence: 62,
            domesticPressure: 48
          },
          secretFlags: ["backchannel-open"],
          availableOptions: [],
          metadata: {}
        },
        {
          factionId: "faction-ussr",
          privateBriefing:
            "Command believes calibrated pressure may split Western partners if escalation stays bounded.",
          intelligence: [
            "Western readiness is rising, but public appetite for direct war remains low."
          ],
          hiddenTracks: {
            commandConfidence: 58,
            pressureWindow: 67
          },
          secretFlags: ["pressure-advantage"],
          availableOptions: [],
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
        warnings: ["Misreading intentions could cause rapid crisis escalation."],
        metadata: {}
      },
      initialOptions: [
        {
          id: "option-usa-protest",
          scenarioId: "scenario-cold-war-berlin-mvp",
          factionId: "faction-usa",
          kind: "diplomatic",
          title: "Issue a formal protest",
          summary: "Condemn access restrictions while keeping military posture stable.",
          visibility: "public",
          requirementTags: ["briefing"],
          consequenceHints: ["lower-escalation", "limited-leverage"],
          recommendationPercent: 61,
          metadata: {}
        },
        {
          id: "option-usa-airlift",
          scenarioId: "scenario-cold-war-berlin-mvp",
          factionId: "faction-usa",
          kind: "military_signal",
          title: "Expand airlift operations",
          summary: "Demonstrate resolve without direct ground confrontation.",
          visibility: "public",
          requirementTags: ["briefing"],
          consequenceHints: ["higher-risk", "alliance-credibility"],
          recommendationPercent: 68,
          metadata: {}
        }
      ]
    },
    choiceCatalog: [
      {
        id: "option-usa-protest",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        kind: "diplomatic",
        title: "Issue a formal protest",
        summary: "Condemn access restrictions while keeping military posture stable.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["lower-escalation", "limited-leverage"],
        recommendationPercent: 61,
        metadata: {}
      },
      {
        id: "option-usa-airlift",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        kind: "military_signal",
        title: "Expand airlift operations",
        summary: "Demonstrate resolve without direct ground confrontation.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["higher-risk", "alliance-credibility"],
        recommendationPercent: 68,
        metadata: {}
      },
      {
        id: "option-ussr-pressure",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-ussr",
        kind: "economic",
        title: "Tighten administrative pressure",
        summary: "Increase friction to test Western tolerance without overt military action.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["pressure", "ambiguity"],
        recommendationPercent: 57,
        metadata: {}
      },
      {
        id: "option-ussr-backchannel",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-ussr",
        kind: "diplomatic",
        title: "Open a quiet negotiating channel",
        summary: "Probe for concessions while preserving public leverage.",
        visibility: "private",
        requirementTags: ["briefing"],
        consequenceHints: ["lower-escalation", "uncertain-concessions"],
        recommendationPercent: 63,
        metadata: {}
      }
    ],
    metadata: {
      family: "cold-war",
      order: 1
    }
  });
}
