import { scenarioDefinitionSchema } from "@wargame/shared";

export function createSuezMvpScenarioDefinition() {
  return scenarioDefinitionSchema.parse({
    id: "scenario-suez-crisis-mvp",
    slug: "suez-crisis-mvp",
    title: "Suez Crisis MVP",
    description:
      "A post-imperial canal crisis centered on legitimacy, coercion, and political timing rather than pure superpower deterrence.",
    historicalFrame:
      "A 1956-style Suez confrontation where military moves, canal disruption, alliance politics, and international opinion all shape the crisis.",
    complexity: "standard",
    supportedModes: ["solo", "head_to_head"],
    maxPlayers: 2,
    startingTurn: 1,
    objectives: [
      {
        id: "objective-coalition-restore-passage",
        factionId: "faction-anglo-french",
        title: "Restore passage without strategic isolation",
        summary:
          "Reassert control over canal access, protect credibility, and pressure Cairo into concessions without triggering overwhelming diplomatic backlash.",
        successSignals: [
          "Canal control or transit access improves for the coalition.",
          "International pressure stays manageable enough for coercion to remain politically useful."
        ],
        failureSignals: [
          "International opposition hardens faster than coalition leverage.",
          "Military gains become politically unsustainable."
        ],
        visibility: "public",
        metadata: {}
      },
      {
        id: "objective-egypt-hold-sovereignty",
        factionId: "faction-egypt",
        title: "Hold sovereignty and raise the political cost",
        summary:
          "Preserve Egyptian control over the canal question, turn outside pressure into a legitimacy advantage, and avoid a collapse under combined military and financial strain.",
        successSignals: [
          "Egypt retains or regains practical control while world opinion shifts against intervention.",
          "Outside powers lose freedom of action as the crisis drags on."
        ],
        failureSignals: [
          "Military tempo outruns diplomatic resistance.",
          "Egypt loses initiative without securing strong outside support."
        ],
        visibility: "public",
        metadata: {}
      }
    ],
    factions: [
      {
        id: "faction-anglo-french",
        scenarioId: "scenario-suez-crisis-mvp",
        slug: "anglo-french",
        name: "Anglo-French Coalition",
        role: "major_power",
        description:
          "A coalition balancing military capability with alliance strain and international scrutiny.",
        doctrineSummary:
          "Apply pressure fast, preserve coalition cohesion, and avoid diplomatic isolation.",
        publicTraits: ["expeditionary-force", "financial-leverage"],
        privateTraits: ["cabinet-friction", "external-pressure"],
        colorToken: "navy",
        isPlayable: true,
        metadata: {}
      },
      {
        id: "faction-egypt",
        scenarioId: "scenario-suez-crisis-mvp",
        slug: "egypt",
        name: "Egyptian Republic",
        role: "regional_power",
        description:
          "A regional government fighting to preserve sovereignty, political legitimacy, and room to maneuver.",
        doctrineSummary:
          "Hold sovereignty, internationalize the dispute, and make intervention politically costly.",
        publicTraits: ["territorial-control", "national-legitimacy"],
        privateTraits: ["arab-solidarity", "security-dispersal"],
        colorToken: "gold",
        isPlayable: true,
        metadata: {}
      }
    ],
    openingState: {
      publicState: {
        scenarioId: "scenario-suez-crisis-mvp",
        turnNumber: 1,
        activeFactionId: "faction-anglo-french",
        phase: "briefing",
        worldTension: 52,
        publicNarrative:
          "The canal dispute has moved beyond speeches into a coercive showdown shaped by shipping risk, alliance politics, and the threat of intervention.",
        headline: "Suez standoff enters a dangerous political phase",
        visibleTracks: {
          canalControl: 58,
          internationalPressure: 54,
          militaryTempo: 43
        },
        publicFlags: ["suez-crisis", "canal-dispute"],
        revealedEvents: ["canal-nationalization-dispute"],
        metadata: {}
      },
      privateStates: [
        {
          factionId: "faction-anglo-french",
          privateBriefing:
            "The coalition can still move quickly, but Washington's patience is thinning and cabinet unity will not survive an open-ended fiasco.",
          intelligence: [
            "Cairo expects outside political pressure to matter almost as much as military balance.",
            "Shipping insurers are watching for any sign that the canal may become unusable."
          ],
          hiddenTracks: {
            coalitionUnity: 57,
            usPressure: 49
          },
          secretFlags: ["coalition-timetable-sensitive"],
          availableOptions: [],
          metadata: {}
        },
        {
          factionId: "faction-egypt",
          privateBriefing:
            "Egypt can gain politically if intervention looks heavy-handed, but the canal and airfields remain exposed to a sudden coalition blow.",
          intelligence: [
            "International sympathy is rising, but not yet fast enough to guarantee restraint from London and Paris."
          ],
          hiddenTracks: {
            regimeCohesion: 61,
            arabSupport: 55
          },
          secretFlags: ["international-sympathy-rising"],
          availableOptions: [],
          metadata: {}
        }
      ],
      derivedState: {
        escalationRiskPercent: 41,
        negotiationLeverage: {
          "faction-anglo-french": 51,
          "faction-egypt": 53
        },
        factionMomentum: {
          "faction-anglo-french": 49,
          "faction-egypt": 52
        },
        outcome: {
          status: "ongoing",
          category: null,
          title: null,
          summary: null,
          winningFactionId: null,
          achievedAtTurn: null,
          pressure: {
            maturityPercent: 14,
            decisiveOutcomePercent: 26,
            deescalationOpportunityPercent: 31,
            catastrophicRiskPercent: 39
          },
          publicObjectiveProgress: {
            "faction-anglo-french": 48,
            "faction-egypt": 54
          },
          metadata: {}
        },
        warnings: [
          "A move that looks tactically clever may still trigger severe diplomatic backlash."
        ],
        metadata: {}
      },
      initialOptions: [
        {
          id: "option-coalition-ultimatum",
          scenarioId: "scenario-suez-crisis-mvp",
          factionId: "faction-anglo-french",
          kind: "diplomatic",
          title: "Issue a joint ultimatum",
          summary:
            "Frame intervention as a security necessity and force Cairo to answer under public pressure.",
          visibility: "public",
          requirementTags: ["briefing"],
          consequenceHints: ["diplomatic-pressure", "legitimacy-risk"],
          recommendationPercent: 60,
          effectProfile: {
            worldTensionDelta: 5,
            escalationRiskDelta: 3,
            visibleTrackDeltas: {
              internationalPressure: 6,
              militaryTempo: 2
            },
            negotiationLeverageDeltas: {
              "faction-anglo-french": 4,
              "faction-egypt": -1
            },
            factionMomentumDeltas: {
              "faction-anglo-french": 3
            },
            publicFlagAdds: ["coalition-ultimatum"],
            publicFlagRemoves: [],
            revealedEventAdds: ["ultimatum-delivered"],
            warningAdds: ["Public justifications are sharpening the diplomatic stakes."]
          },
          metadata: {}
        },
        {
          id: "option-coalition-airborne-plan",
          scenarioId: "scenario-suez-crisis-mvp",
          factionId: "faction-anglo-french",
          kind: "military_signal",
          title: "Ready a limited airborne seizure plan",
          summary:
            "Accelerate intervention planning to seize the initiative before outside pressure closes the window.",
          visibility: "public",
          requirementTags: ["briefing"],
          consequenceHints: ["high-risk", "tempo"],
          recommendationPercent: 66,
          effectProfile: {
            worldTensionDelta: 11,
            escalationRiskDelta: 9,
            visibleTrackDeltas: {
              militaryTempo: 10,
              internationalPressure: 4
            },
            negotiationLeverageDeltas: {
              "faction-anglo-french": 5,
              "faction-egypt": -2
            },
            factionMomentumDeltas: {
              "faction-anglo-french": 7,
              "faction-egypt": -2
            },
            publicFlagAdds: ["airborne-plan-readied"],
            publicFlagRemoves: [],
            revealedEventAdds: ["coalition-forces-mobilizing"],
            warningAdds: ["Military preparation could outrun diplomatic cover."]
          },
          metadata: {}
        }
      ]
    },
    choiceCatalog: [
      {
        id: "option-coalition-ultimatum",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-anglo-french",
        kind: "diplomatic",
        title: "Issue a joint ultimatum",
        summary:
          "Frame intervention as a security necessity and force Cairo to answer under public pressure.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["diplomatic-pressure", "legitimacy-risk"],
        recommendationPercent: 60,
        effectProfile: {
          worldTensionDelta: 5,
          escalationRiskDelta: 3,
          visibleTrackDeltas: {
            internationalPressure: 6,
            militaryTempo: 2
          },
          negotiationLeverageDeltas: {
            "faction-anglo-french": 4,
            "faction-egypt": -1
          },
          factionMomentumDeltas: {
            "faction-anglo-french": 3
          },
          publicFlagAdds: ["coalition-ultimatum"],
          publicFlagRemoves: [],
          revealedEventAdds: ["ultimatum-delivered"],
          warningAdds: ["Public justifications are sharpening the diplomatic stakes."]
        },
        metadata: {}
      },
      {
        id: "option-coalition-airborne-plan",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-anglo-french",
        kind: "military_signal",
        title: "Ready a limited airborne seizure plan",
        summary:
          "Accelerate intervention planning to seize the initiative before outside pressure closes the window.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["high-risk", "tempo"],
        recommendationPercent: 66,
        effectProfile: {
          worldTensionDelta: 11,
          escalationRiskDelta: 9,
          visibleTrackDeltas: {
            militaryTempo: 10,
            internationalPressure: 4
          },
          negotiationLeverageDeltas: {
            "faction-anglo-french": 5,
            "faction-egypt": -2
          },
          factionMomentumDeltas: {
            "faction-anglo-french": 7,
            "faction-egypt": -2
          },
          publicFlagAdds: ["airborne-plan-readied"],
          publicFlagRemoves: [],
          revealedEventAdds: ["coalition-forces-mobilizing"],
          warningAdds: ["Military preparation could outrun diplomatic cover."]
        },
        metadata: {}
      },
      {
        id: "option-coalition-financial-pressure",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-anglo-french",
        kind: "economic",
        title: "Tighten insurance and port pressure",
        summary:
          "Use shipping, finance, and insurance leverage to raise the practical cost of Egyptian control.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["economic-pressure", "slower-burn"],
        recommendationPercent: 62,
        effectProfile: {
          worldTensionDelta: 4,
          escalationRiskDelta: 2,
          visibleTrackDeltas: {
            canalControl: -4,
            internationalPressure: 3
          },
          negotiationLeverageDeltas: {
            "faction-anglo-french": 6,
            "faction-egypt": -2
          },
          factionMomentumDeltas: {
            "faction-anglo-french": 4
          },
          publicFlagAdds: ["financial-pressure-campaign"],
          publicFlagRemoves: [],
          revealedEventAdds: ["shipping-insurance-disruptions"],
          warningAdds: []
        },
        metadata: {}
      },
      {
        id: "option-coalition-covert-liaison",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-anglo-french",
        kind: "intelligence",
        title: "Deepen covert liaison and deception",
        summary:
          "Coordinate quietly to improve operational surprise while keeping public commitments ambiguous.",
        visibility: "private",
        requirementTags: ["briefing"],
        consequenceHints: ["covert", "uncertain-payoff"],
        recommendationPercent: 58,
        effectProfile: {
          worldTensionDelta: 6,
          escalationRiskDelta: 5,
          visibleTrackDeltas: {
            militaryTempo: 4
          },
          negotiationLeverageDeltas: {
            "faction-anglo-french": 5
          },
          factionMomentumDeltas: {
            "faction-anglo-french": 5
          },
          publicFlagAdds: ["covert-preparations"],
          publicFlagRemoves: [],
          revealedEventAdds: ["rumors-of-coordination"],
          warningAdds: ["Hidden coordination may be hard to contain once exposed."]
        },
        metadata: {}
      },
      {
        id: "option-coalition-parliament-case",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-anglo-french",
        kind: "propaganda",
        title: "Make the parliamentary case for intervention",
        summary:
          "Build domestic and allied justification before taking a more visible coercive step.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["domestic-political", "legitimacy"],
        recommendationPercent: 56,
        effectProfile: {
          worldTensionDelta: 2,
          escalationRiskDelta: 1,
          visibleTrackDeltas: {
            internationalPressure: 2
          },
          negotiationLeverageDeltas: {
            "faction-anglo-french": 3
          },
          factionMomentumDeltas: {
            "faction-anglo-french": 2
          },
          publicFlagAdds: ["intervention-case-built"],
          publicFlagRemoves: [],
          revealedEventAdds: ["parliamentary-debate-intensifies"],
          warningAdds: []
        },
        metadata: {}
      },
      {
        id: "option-egypt-un-appeal",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-egypt",
        kind: "diplomatic",
        title: "Appeal urgently to the United Nations",
        summary:
          "Internationalize the crisis and force outside powers to defend their position in public.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["legitimacy", "de-escalation-window"],
        recommendationPercent: 67,
        effectProfile: {
          worldTensionDelta: -1,
          escalationRiskDelta: -2,
          visibleTrackDeltas: {
            internationalPressure: 8
          },
          negotiationLeverageDeltas: {
            "faction-egypt": 7,
            "faction-anglo-french": -2
          },
          factionMomentumDeltas: {
            "faction-egypt": 5
          },
          publicFlagAdds: ["un-appeal-filed"],
          publicFlagRemoves: [],
          revealedEventAdds: ["emergency-un-session-sought"],
          warningAdds: []
        },
        metadata: {}
      },
      {
        id: "option-egypt-canal-disruption",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-egypt",
        kind: "economic",
        title: "Disrupt canal operations to deny an easy gain",
        summary:
          "Make control of the canal more costly and complicated, even if shipping disruption rises sharply.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["economic-shock", "high-cost"],
        recommendationPercent: 59,
        effectProfile: {
          worldTensionDelta: 7,
          escalationRiskDelta: 5,
          visibleTrackDeltas: {
            canalControl: -6,
            internationalPressure: 5,
            militaryTempo: 2
          },
          negotiationLeverageDeltas: {
            "faction-egypt": 4,
            "faction-anglo-french": -1
          },
          factionMomentumDeltas: {
            "faction-egypt": 4
          },
          publicFlagAdds: ["canal-operations-disrupted"],
          publicFlagRemoves: [],
          revealedEventAdds: ["shipping-delays-spread"],
          warningAdds: ["Economic disruption is making outside intervention harder to calibrate."]
        },
        metadata: {}
      },
      {
        id: "option-egypt-air-defense-dispersal",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-egypt",
        kind: "intelligence",
        title: "Disperse air assets and security services",
        summary:
          "Reduce vulnerability to a sudden strike while keeping exact defensive posture opaque.",
        visibility: "private",
        requirementTags: ["briefing"],
        consequenceHints: ["covert-preparation", "resilience"],
        recommendationPercent: 63,
        effectProfile: {
          worldTensionDelta: 4,
          escalationRiskDelta: 2,
          visibleTrackDeltas: {
            militaryTempo: 3
          },
          negotiationLeverageDeltas: {
            "faction-egypt": 5
          },
          factionMomentumDeltas: {
            "faction-egypt": 6
          },
          publicFlagAdds: ["defenses-dispersed"],
          publicFlagRemoves: [],
          revealedEventAdds: ["security-redeployments-reported"],
          warningAdds: []
        },
        metadata: {}
      },
      {
        id: "option-egypt-radio-campaign",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-egypt",
        kind: "propaganda",
        title: "Launch a regional radio campaign",
        summary:
          "Turn the crisis into a broader anti-imperial political contest that constrains coalition freedom of action.",
        visibility: "public",
        requirementTags: ["briefing"],
        consequenceHints: ["regional-opinion", "legitimacy"],
        recommendationPercent: 61,
        effectProfile: {
          worldTensionDelta: 3,
          escalationRiskDelta: 1,
          visibleTrackDeltas: {
            internationalPressure: 6
          },
          negotiationLeverageDeltas: {
            "faction-egypt": 4,
            "faction-anglo-french": -2
          },
          factionMomentumDeltas: {
            "faction-egypt": 5
          },
          publicFlagAdds: ["regional-radio-campaign"],
          publicFlagRemoves: [],
          revealedEventAdds: ["regional-opinion-hardens"],
          warningAdds: []
        },
        metadata: {}
      },
      {
        id: "option-egypt-superpower-mediation",
        scenarioId: "scenario-suez-crisis-mvp",
        factionId: "faction-egypt",
        kind: "special",
        title: "Seek superpower mediation quietly",
        summary:
          "Look for outside restraint on the coalition without surrendering public claims of sovereignty.",
        visibility: "private",
        requirementTags: ["briefing"],
        consequenceHints: ["de-escalation", "external-balancing"],
        recommendationPercent: 64,
        effectProfile: {
          worldTensionDelta: -4,
          escalationRiskDelta: -5,
          visibleTrackDeltas: {
            internationalPressure: 4
          },
          negotiationLeverageDeltas: {
            "faction-egypt": 6,
            "faction-anglo-french": -1
          },
          factionMomentumDeltas: {
            "faction-egypt": 3
          },
          publicFlagAdds: ["external-mediation-sought"],
          publicFlagRemoves: [],
          revealedEventAdds: ["outside-diplomatic-contact-rumored"],
          warningAdds: []
        },
        metadata: {}
      }
    ],
    metadata: {
      family: "post-imperial-crisis",
      order: 2
    }
  });
}
