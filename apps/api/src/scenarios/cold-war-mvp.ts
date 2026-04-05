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
        metadata: {
          optionRules: {
            oncePerGame: true,
            maxWorldTension: 72
          }
        }
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
        metadata: {
          optionRules: {
            cooldownRounds: 2
          }
        }
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
        metadata: {
          strategyProfile: {
            doctrineLabel: "measured resolve under allied scrutiny",
            preferredCategories: ["diplomatic", "intelligence", "military"],
            cautiousCategories: ["military"],
            categoryBiases: {
              diplomatic: 3,
              intelligence: 5,
              military: 1
            },
            pressureBias: 2,
            restraintBias: 9,
            initiativeBias: 4,
            scenarioFocus: "superpower signaling and allied credibility in Berlin",
            contestedPriority:
              "Berlin remains a test of credibility, so measured resolve should keep allied confidence high without drifting into automatic military escalation.",
            recoveryPriority:
              "Visible pressure is slipping in Berlin, so the next move should recover leverage through legitimacy and signaling before the corridor question hardens further.",
            protectionPriority:
              "The coalition is visibly ahead, so protect allied credibility in Berlin without giving Moscow an easy escalation narrative.",
            escalationPriority:
              "Escalation around Berlin is nearing the line where even symbolic overreach could become strategic self-harm, so controlled signaling now matters more than bravado."
          },
          privateStateProfile: {
            defaultActingTrackDeltas: {
              allianceConfidence: 1
            },
            defaultReactingTrackDeltas: {
              domesticPressure: 1
            },
            actingTrackDeltasByCategory: {
              diplomatic: {
                allianceConfidence: 2,
                domesticPressure: -1
              },
              intelligence: {
                allianceConfidence: 1,
                domesticPressure: -2
              },
              military: {
                allianceConfidence: 2,
                domesticPressure: 3
              }
            },
            reactingTrackDeltasByCategory: {
              economic: {
                allianceConfidence: -2,
                domesticPressure: 1
              },
              military: {
                allianceConfidence: -3,
                domesticPressure: 2
              }
            },
            actingFlagAddsByCategory: {
              intelligence: ["backchannel-open"],
              military: ["hawks-alert"]
            },
            highTensionTrackDeltas: {
              acting: {
                domesticPressure: 2
              },
              reacting: {
                domesticPressure: 2
              }
            },
            thresholdRules: [
              {
                track: "allianceConfidence",
                min: 65,
                addFlags: ["alliance-solidifying"]
              },
              {
                track: "domesticPressure",
                min: 58,
                addFlags: ["hawks-alert"]
              }
            ]
          }
        }
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
        metadata: {
          strategyProfile: {
            doctrineLabel: "coercive leverage below the threshold of war",
            preferredCategories: ["economic", "military", "diplomatic"],
            cautiousCategories: ["military"],
            categoryBiases: {
              economic: 5,
              military: 2,
              diplomatic: 1
            },
            pressureBias: 10,
            restraintBias: 2,
            initiativeBias: 8,
            scenarioFocus: "pressure, ambiguity, and bargaining leverage in Berlin",
            contestedPriority:
              "Berlin still rewards coercive leverage, so sustained pressure should outpace Western reassurance without making the crisis obviously uncontrollable.",
            recoveryPriority:
              "If leverage is slipping in Berlin, the next move should reopen ambiguity and bargaining pressure before the West locks in a stable coalition response.",
            protectionPriority:
              "With pressure already landing, keep the initiative in Berlin by preserving ambiguity instead of forcing a crisis spike that invites unified resistance.",
            escalationPriority:
              "Berlin is close to punishing overt overreach, so preserving coercive leverage now matters more than visibly maximal threats."
          },
          privateStateProfile: {
            defaultActingTrackDeltas: {
              pressureWindow: 1
            },
            defaultReactingTrackDeltas: {
              commandConfidence: -1
            },
            actingTrackDeltasByCategory: {
              economic: {
                pressureWindow: 4,
                commandConfidence: 1
              },
              diplomatic: {
                commandConfidence: 2
              },
              military: {
                pressureWindow: 3,
                commandConfidence: -2
              }
            },
            reactingTrackDeltasByCategory: {
              diplomatic: {
                pressureWindow: -1,
                commandConfidence: 1
              },
              military: {
                pressureWindow: -2,
                commandConfidence: -2
              }
            },
            actingFlagAddsByCategory: {
              economic: ["pressure-advantage"],
              military: ["escalatory-window"]
            },
            highTensionTrackDeltas: {
              acting: {
                commandConfidence: -2
              },
              reacting: {
                commandConfidence: -1
              }
            },
            thresholdRules: [
              {
                track: "pressureWindow",
                min: 70,
                addFlags: ["pressure-advantage"]
              },
              {
                track: "commandConfidence",
                max: 45,
                addFlags: ["command-strain"]
              }
            ]
          }
        }
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
        metadata: {
          optionRules: {
            cooldownRounds: 2
          }
        }
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
        metadata: {
          optionRules: {
            oncePerGame: true,
            requiredPublicFlags: ["berlin-crisis"]
          }
        }
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
        metadata: {
          optionRules: {
            oncePerGame: true,
            maxWorldTension: 72
          }
        }
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
        metadata: {
          optionRules: {
            cooldownRounds: 2
          }
        }
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
        metadata: {
          optionRules: {
            oncePerGame: true,
            requiredPublicFlags: ["berlin-crisis"]
          }
        }
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
        metadata: {
          optionRules: {
            requiredSecretFlags: ["backchannel-open"],
            cooldownRounds: 2,
            maxWorldTension: 70
          }
        }
      },
      {
        id: "option-usa-airlift-followup-template",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-usa",
        kind: "military_signal",
        title: "Airlift follow-up template",
        summary:
          "Template for follow-up actions after the airlift has become the center of the crisis.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["followup"],
        recommendationPercent: 60,
        effectProfile: {
          worldTensionDelta: 0,
          escalationRiskDelta: 0,
          visibleTrackDeltas: {},
          negotiationLeverageDeltas: {},
          factionMomentumDeltas: {},
          publicFlagAdds: [],
          publicFlagRemoves: [],
          revealedEventAdds: [],
          warningAdds: []
        },
        metadata: {
          optionRules: {
            requiredPublicFlags: ["airlift-expanded"],
            followupToOptionIds: ["option-usa-airlift"],
            cooldownRounds: 2
          },
          generatedVariants: [
            {
              id: "option-usa-airlift-harden",
              title: "Harden the air corridor",
              summary:
                "Convert earlier resolve into a more resilient air corridor posture before Soviet pressure adapts.",
              consequenceHints: ["followup", "sustained-resolve"],
              recommendationPercent: 62,
              effectProfile: {
                worldTensionDelta: 4,
                escalationRiskDelta: 3,
                visibleTrackDeltas: {
                  militaryPosture: 4,
                  diplomaticPressure: 2
                },
                negotiationLeverageDeltas: {
                  "faction-usa": 4,
                  "faction-ussr": -1
                },
                factionMomentumDeltas: {
                  "faction-usa": 5
                },
                publicFlagAdds: ["air-corridor-hardened"],
                revealedEventAdds: ["airlift-routes-reorganized"],
                warningAdds: [
                  "Sustained air access now depends on continued political discipline."
                ]
              },
              metadata: {}
            },
            {
              id: "option-usa-airlift-relief-window",
              title: "Create a relief window around the airlift",
              summary:
                "Pair the airlift with a tightly managed diplomatic pause to keep Allied support firm while pressure remains visible.",
              kind: "diplomatic",
              consequenceHints: ["followup", "controlled-offramp"],
              recommendationPercent: 58,
              effectProfile: {
                worldTensionDelta: -1,
                escalationRiskDelta: -2,
                visibleTrackDeltas: {
                  diplomaticPressure: 3,
                  globalAttention: 1
                },
                negotiationLeverageDeltas: {
                  "faction-usa": 3
                },
                factionMomentumDeltas: {
                  "faction-usa": 2
                },
                publicFlagAdds: ["airlift-relief-window"],
                revealedEventAdds: ["allied-relief-window-signaled"]
              },
              metadata: {
                optionRules: {
                  maxWorldTension: 75
                }
              }
            }
          ]
        }
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
        metadata: {
          optionRules: {
            cooldownRounds: 2
          }
        }
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
        metadata: {
          optionRules: {
            requiredSecretFlags: ["pressure-advantage"],
            cooldownRounds: 2,
            maxWorldTension: 75
          }
        }
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
        metadata: {
          optionRules: {
            minWorldTension: 48,
            cooldownRounds: 2
          }
        }
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
      },
      {
        id: "option-ussr-exploit-airlift-strain",
        scenarioId: "scenario-cold-war-berlin-mvp",
        factionId: "faction-ussr",
        kind: "intelligence",
        title: "Exploit airlift strain indirectly",
        summary:
          "Lean on deniable pressure and logistics friction once the Western air effort is visibly committed.",
        visibility: "private",
        requirementTags: ["briefing"],
        consequenceHints: ["followup", "covert-pressure"],
        recommendationPercent: 64,
        effectProfile: {
          worldTensionDelta: 3,
          escalationRiskDelta: 2,
          visibleTrackDeltas: {
            diplomaticPressure: 3,
            globalAttention: 2
          },
          negotiationLeverageDeltas: {
            "faction-ussr": 5,
            "faction-usa": -2
          },
          factionMomentumDeltas: {
            "faction-ussr": 4
          },
          publicFlagAdds: ["airlift-under-strain"],
          publicFlagRemoves: [],
          revealedEventAdds: ["corridor-harassment-reports"],
          warningAdds: ["Covert friction can still provoke a dangerous overreaction."]
        },
        metadata: {
          optionRules: {
            requiredPublicFlags: ["airlift-expanded"],
            minVisibleTracks: {
              militaryPosture: 45
            }
          }
        }
      }
    ],
    metadata: {
      family: "cold-war",
      order: 1,
      eventRules: [
        {
          id: "berlin-airlift-symbolism-surges",
          minRound: 1,
          minWorldTension: 50,
          requiredRevealedEvents: ["airlift-sorties-expanded"],
          absentRevealedEvents: ["berlin-airlift-symbolism-surges"],
          effect: {
            revealEventId: "berlin-airlift-symbolism-surges",
            visibleTrackDeltas: {
              globalAttention: 8,
              diplomaticPressure: 3
            },
            publicFlagAdds: ["airlift-becomes-global-symbol"],
            warningAdds: [
              "The airlift is becoming a wider symbol of resolve, raising the political stakes of every follow-up move."
            ]
          }
        },
        {
          id: "berlin-administrative-squeeze-hardens",
          minRound: 2,
          requiredPublicFlags: ["administrative-pressure-expanded"],
          absentRevealedEvents: ["berlin-administrative-squeeze-hardens"],
          effect: {
            revealEventId: "berlin-administrative-squeeze-hardens",
            worldTensionDelta: 2,
            escalationRiskDelta: 2,
            visibleTrackDeltas: {
              diplomaticPressure: 5,
              globalAttention: 4
            },
            publicFlagAdds: ["checkpoint-crisis-hardening"],
            warningAdds: [
              "Administrative pressure is hardening into a broader checkpoint crisis with less room for casual signaling."
            ]
          }
        },
        {
          id: "berlin-airlift-offramp-emerges",
          minRound: 2,
          requiredPublicFlags: ["airlift-relief-window", "airlift-becomes-global-symbol"],
          requiredRevealedEvents: ["berlin-airlift-symbolism-surges"],
          absentRevealedEvents: ["berlin-airlift-offramp-emerges"],
          effect: {
            revealEventId: "berlin-airlift-offramp-emerges",
            worldTensionDelta: -5,
            escalationRiskDelta: -6,
            visibleTrackDeltas: {
              diplomaticPressure: 2,
              militaryPosture: -3,
              globalAttention: 2
            },
            publicFlagAdds: ["berlin-offramp-visible"],
            warningAdds: [
              "A narrow diplomatic off-ramp is becoming visible around the airlift, but it will collapse quickly if either bloc overplays the next exchange."
            ]
          }
        },
        {
          id: "berlin-checkpoint-faceoff-intensifies",
          minRound: 2,
          requiredPublicFlags: ["checkpoint-probe", "checkpoint-crisis-hardening"],
          requiredRevealedEvents: [
            "berlin-administrative-squeeze-hardens",
            "checkpoint-columns-mobilized"
          ],
          absentRevealedEvents: ["berlin-checkpoint-faceoff-intensifies"],
          effect: {
            revealEventId: "berlin-checkpoint-faceoff-intensifies",
            worldTensionDelta: 4,
            escalationRiskDelta: 7,
            visibleTrackDeltas: {
              militaryPosture: 7,
              diplomaticPressure: 2,
              globalAttention: 3
            },
            publicFlagAdds: ["checkpoint-faceoff-active"],
            warningAdds: [
              "Checkpoint probing is hardening into a direct faceoff, making symbolic missteps much more likely to trigger uncontrolled escalation."
            ]
          }
        }
      ],
      outcomeModel: {
        guidanceRoundsByLength: {
          short: 4,
          medium: 6,
          long: 8
        },
        catastrophicMinMaturityByLength: {
          short: 75,
          medium: 22,
          long: 22
        },
        strategicMinMaturityByLength: {
          short: 75,
          medium: 32,
          long: 32
        },
        partialMinMaturityByLength: {
          short: 75,
          medium: 25,
          long: 25
        },
        factionProgressModels: {
          "faction-usa": {
            leverageWeight: 0.34,
            momentumWeight: 0.24,
            worldTensionWeight: -0.08,
            escalationRiskWeight: -0.07,
            visibleTrackWeights: {
              globalAttention: 0.18,
              diplomaticPressure: 0.09,
              militaryPosture: -0.08
            },
            base: 18
          },
          "faction-ussr": {
            leverageWeight: 0.3,
            momentumWeight: 0.26,
            worldTensionWeight: 0.06,
            escalationRiskWeight: -0.02,
            visibleTrackWeights: {
              diplomaticPressure: 0.18,
              militaryPosture: 0.1,
              globalAttention: 0.06
            },
            base: 16
          }
        },
        deescalationTrackWeights: {
          diplomaticPressure: 0.07,
          globalAttention: 0.05
        },
        conditionModifiers: [
          {
            requiredPublicFlags: ["berlin-offramp-visible"],
            requiredRevealedEvents: ["berlin-airlift-offramp-emerges"],
            factionProgressBonuses: {
              "faction-usa": 4,
              "faction-ussr": -2
            },
            deescalationBonus: 12,
            decisiveBonus: 4
          },
          {
            requiredPublicFlags: ["checkpoint-faceoff-active"],
            requiredRevealedEvents: ["berlin-checkpoint-faceoff-intensifies"],
            factionProgressBonuses: {
              "faction-ussr": 5,
              "faction-usa": -3
            },
            catastrophicBonus: 14,
            decisiveBonus: 6
          }
        ],
        deescalationBaseThreshold: 75,
        deescalationMaturityDivisor: 9,
        catastrophicTrackWeights: {
          militaryPosture: 0.1,
          diplomaticPressure: 0.03
        },
        catastrophicBaseThreshold: 92,
        catastrophicMaturityDivisor: 7,
        minResolutionMaturityPercent: 22,
        stalemateMaturityThreshold: 78,
        stalemateLeadThreshold: 7
      }
    }
  });
}
