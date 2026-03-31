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
    objectives: [
      {
        id: "objective-usa-hold-berlin",
        factionId: "faction-usa",
        title: "Hold access and allied credibility",
        summary:
          "Keep Berlin viable, preserve coalition confidence, and show resolve without letting the crisis spin into open war.",
        successSignals: [
          "Western leverage improves while tension stays containable.",
          "Public attention reinforces Allied legitimacy instead of panic."
        ],
        failureSignals: [
          "Escalation outruns control.",
          "Soviet pressure fractures Western resolve or forces visible retreat."
        ],
        visibility: "public",
        metadata: {}
      },
      {
        id: "objective-ussr-force-concessions",
        factionId: "faction-ussr",
        title: "Force concessions without triggering war",
        summary:
          "Sustain coercive leverage, test Western staying power, and extract advantage while avoiding catastrophic superpower escalation.",
        successSignals: [
          "Pressure rises faster than Western negotiating leverage.",
          "Moscow keeps the initiative without crossing into uncontrolled conflict."
        ],
        failureSignals: [
          "Pressure hardens Allied resolve instead of splitting it.",
          "Escalation becomes too dangerous to exploit."
        ],
        visibility: "public",
        metadata: {}
      }
    ],
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
        outcome: {
          status: "ongoing",
          category: null,
          title: null,
          summary: null,
          winningFactionId: null,
          achievedAtTurn: null,
          pressure: {
            maturityPercent: 8,
            decisiveOutcomePercent: 18,
            deescalationOpportunityPercent: 46,
            catastrophicRiskPercent: 32
          },
          publicObjectiveProgress: {
            "faction-usa": 53,
            "faction-ussr": 50
          },
          metadata: {}
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
          effectProfile: {
            worldTensionDelta: -2,
            escalationRiskDelta: -3,
            visibleTrackDeltas: {
              diplomaticPressure: 4,
              globalAttention: 5
            },
            negotiationLeverageDeltas: {
              "faction-usa": 5,
              "faction-ussr": -2
            },
            factionMomentumDeltas: {
              "faction-usa": 2
            },
            publicFlagAdds: ["allied-protest"],
            publicFlagRemoves: [],
            revealedEventAdds: ["western-protest-note"],
            warningAdds: []
          },
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
          effectProfile: {
            worldTensionDelta: 8,
            escalationRiskDelta: 6,
            visibleTrackDeltas: {
              militaryPosture: 8,
              globalAttention: 4
            },
            negotiationLeverageDeltas: {
              "faction-usa": 6,
              "faction-ussr": -1
            },
            factionMomentumDeltas: {
              "faction-usa": 7,
              "faction-ussr": -2
            },
            publicFlagAdds: ["airlift-expanded"],
            publicFlagRemoves: [],
            revealedEventAdds: ["airlift-sorties-expanded"],
            warningAdds: ["Military signaling is raising the stakes around Berlin."]
          },
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
        effectProfile: {
          worldTensionDelta: -2,
          escalationRiskDelta: -3,
          visibleTrackDeltas: {
            diplomaticPressure: 4,
            globalAttention: 5
          },
          negotiationLeverageDeltas: {
            "faction-usa": 5,
            "faction-ussr": -2
          },
          factionMomentumDeltas: {
            "faction-usa": 2
          },
          publicFlagAdds: ["allied-protest"],
          publicFlagRemoves: [],
          revealedEventAdds: ["western-protest-note"],
          warningAdds: []
        },
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
        effectProfile: {
          worldTensionDelta: 8,
          escalationRiskDelta: 6,
          visibleTrackDeltas: {
            militaryPosture: 8,
            globalAttention: 4
          },
          negotiationLeverageDeltas: {
            "faction-usa": 6,
            "faction-ussr": -1
          },
          factionMomentumDeltas: {
            "faction-usa": 7,
            "faction-ussr": -2
          },
          publicFlagAdds: ["airlift-expanded"],
          publicFlagRemoves: [],
          revealedEventAdds: ["airlift-sorties-expanded"],
          warningAdds: ["Military signaling is raising the stakes around Berlin."]
        },
        metadata: {}
      },
      {
        id: "option-usa-alliance-summit",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        kind: "diplomatic",
        title: "Convene an emergency allied summit",
        summary:
          "Lock in allied messaging and burden-sharing before Soviet pressure widens political cracks.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["alliance-credibility", "slower-escalation"],
        recommendationPercent: 64,
        effectProfile: {
          worldTensionDelta: 1,
          escalationRiskDelta: -1,
          visibleTrackDeltas: {
            diplomaticPressure: 3,
            globalAttention: 2
          },
          negotiationLeverageDeltas: {
            "faction-usa": 7
          },
          factionMomentumDeltas: {
            "faction-usa": 5
          },
          publicFlagAdds: ["allied-summit"],
          publicFlagRemoves: [],
          revealedEventAdds: ["allied-consultations-begin"],
          warningAdds: []
        },
        metadata: {}
      },
      {
        id: "option-usa-backchannel",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        kind: "intelligence",
        title: "Use backchannels to test an off-ramp",
        summary:
          "Probe for a face-saving arrangement while avoiding a visible climbdown in public posture.",
        visibility: "private",
        requirementTags: ["briefing"],
        consequenceHints: ["de-escalation", "uncertain-payoff"],
        recommendationPercent: 59,
        effectProfile: {
          worldTensionDelta: -5,
          escalationRiskDelta: -6,
          visibleTrackDeltas: {
            diplomaticPressure: -2,
            globalAttention: -1
          },
          negotiationLeverageDeltas: {
            "faction-usa": 3,
            "faction-ussr": 2
          },
          factionMomentumDeltas: {
            "faction-usa": 1
          },
          publicFlagAdds: ["quiet-contact"],
          publicFlagRemoves: [],
          revealedEventAdds: ["signals-of-private-contact"],
          warningAdds: []
        },
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
        effectProfile: {
          worldTensionDelta: 5,
          escalationRiskDelta: 4,
          visibleTrackDeltas: {
            diplomaticPressure: 7,
            globalAttention: 3
          },
          negotiationLeverageDeltas: {
            "faction-ussr": 5,
            "faction-usa": -3
          },
          factionMomentumDeltas: {
            "faction-ussr": 6,
            "faction-usa": -2
          },
          publicFlagAdds: ["administrative-pressure-expanded"],
          publicFlagRemoves: [],
          revealedEventAdds: ["soviet-checks-expanded"],
          warningAdds: ["Incremental coercion is hardening the standoff."]
        },
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
        effectProfile: {
          worldTensionDelta: -4,
          escalationRiskDelta: -5,
          visibleTrackDeltas: {
            diplomaticPressure: -1
          },
          negotiationLeverageDeltas: {
            "faction-ussr": 4,
            "faction-usa": 1
          },
          factionMomentumDeltas: {
            "faction-ussr": 2
          },
          publicFlagAdds: ["quiet-channel-active"],
          publicFlagRemoves: [],
          revealedEventAdds: ["private-overtures-reported"],
          warningAdds: []
        },
        metadata: {}
      },
      {
        id: "option-ussr-probe-checkpoints",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-ussr",
        kind: "military_signal",
        title: "Stage a checkpoint probe",
        summary:
          "Push forces forward just enough to test Western reactions without authorizing open combat.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["higher-risk", "coercive-leverage"],
        recommendationPercent: 66,
        effectProfile: {
          worldTensionDelta: 10,
          escalationRiskDelta: 9,
          visibleTrackDeltas: {
            militaryPosture: 9,
            globalAttention: 5
          },
          negotiationLeverageDeltas: {
            "faction-ussr": 4,
            "faction-usa": -2
          },
          factionMomentumDeltas: {
            "faction-ussr": 8,
            "faction-usa": -3
          },
          publicFlagAdds: ["checkpoint-probe"],
          publicFlagRemoves: [],
          revealedEventAdds: ["checkpoint-columns-mobilized"],
          warningAdds: ["Miscalculation is becoming more likely as armed signaling rises."]
        },
        metadata: {}
      },
      {
        id: "option-ussr-propaganda",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-ussr",
        kind: "propaganda",
        title: "Launch a legitimacy campaign",
        summary:
          "Frame the standoff as a Western provocation to weaken Allied diplomatic footing.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["global-attention", "pressure"],
        recommendationPercent: 58,
        effectProfile: {
          worldTensionDelta: 2,
          escalationRiskDelta: 1,
          visibleTrackDeltas: {
            diplomaticPressure: 4,
            globalAttention: 6
          },
          negotiationLeverageDeltas: {
            "faction-ussr": 3,
            "faction-usa": -2
          },
          factionMomentumDeltas: {
            "faction-ussr": 4
          },
          publicFlagAdds: ["propaganda-campaign"],
          publicFlagRemoves: [],
          revealedEventAdds: ["bloc-media-blitz"],
          warningAdds: []
        },
        metadata: {}
      }
    ],
    metadata: {
      family: "cold-war",
      order: 1
    }
  });
}
