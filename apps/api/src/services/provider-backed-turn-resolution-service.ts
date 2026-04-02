import {
  gameSchema,
  turnGenerationArtifactsSchema,
  turnResolutionSchema,
  type ChoiceOption,
  type Game,
  type Player,
  type PrivatePlayerState
} from "@wargame/shared";
import { ValidationError } from "../errors/app-error.js";
import { logInfo } from "../logger.js";
import type { TurnGenerationProvider } from "../providers/types.js";
import { projectSessionForSelection } from "../repositories/session-visibility-projection.js";
import { buildFactionStrategicSnapshot } from "./faction-strategy-context.js";
import { recordOptionUsageInPrivateStateMetadata } from "./legal-option-service.js";
import { buildAvailableOptions } from "./option-presentation-service.js";
import { evolvePrivateStatesAfterAction } from "./private-state-evolution-service.js";
import { applyScenarioEvents } from "./scenario-event-service.js";
import { generateSessionScopedId } from "./session-debug-service.js";
import { evaluateSessionOutcome } from "./session-outcome-service.js";
import type {
  ResolveTurnInput,
  ResolveTurnResult,
  TurnResolutionService
} from "./types.js";

type PreparedTurnContext = {
  actingPlayer: Player;
  actingPrivateState: PrivatePlayerState;
  selectedOption: ChoiceOption;
  nextFactionId: string | null;
  nextTurnNumber: number;
  nextCompletedRoundCount: number;
  nextRoundActionIndex: number;
  roundNumber: number;
  roundActionIndex: number;
  roundActionCount: number;
  advancesRound: boolean;
  tensionDelta: number;
  nextWorldTension: number;
  resolvedAt: string;
};

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function applyStatDeltas(
  current: Record<string, number>,
  deltas: Record<string, number>
): Record<string, number> {
  const updated = { ...current };

  for (const [key, delta] of Object.entries(deltas)) {
    updated[key] = clampPercentage((updated[key] ?? 0) + delta);
  }

  return updated;
}

function applyStringAddsAndRemoves(input: {
  current: string[];
  adds: string[];
  removes: string[];
}) {
  const result = new Set(input.current);

  for (const value of input.removes) {
    result.delete(value);
  }

  for (const value of input.adds) {
    result.add(value);
  }

  return [...result];
}

function sanitizePrivateSummaries(input: {
  privateSummaries: ResolveTurnResult["resolution"]["privateSummaries"];
  actingPlayerId: string;
  actingFactionId: string;
}) {
  return input.privateSummaries.filter(
    (summary) =>
      summary.factionId === input.actingFactionId &&
      (summary.playerId === null || summary.playerId === input.actingPlayerId)
  );
}

function sanitizeNarrativePrivateUpdates(input: {
  privateUpdates: ResolveTurnResult["resolution"]["llmNarrative"]["privateUpdates"];
  actingFactionId: string;
}) {
  return input.privateUpdates.filter(
    (update) => update.factionId === input.actingFactionId
  );
}

function findPrivateStateForFaction(game: Game, factionId: string | null) {
  if (!factionId) {
    return null;
  }

  return game.state.privateByPlayer.find((state) => state.factionId === factionId) ?? null;
}

function findPrivateStateInCollection(
  privateStates: Game["state"]["privateByPlayer"],
  factionId: string | null
) {
  if (!factionId) {
    return null;
  }

  return privateStates.find((state) => state.factionId === factionId) ?? null;
}

function getFactionName(game: Game, factionId: string | null) {
  return game.factions.find((faction) => faction.id === factionId)?.name ?? factionId ?? "Unknown faction";
}

function buildPrivateBriefing(input: {
  state: Game["state"]["privateByPlayer"][number];
  game: Game;
  scenario: ResolveTurnInput["scenario"];
  selectedOption: ChoiceOption;
  actionFactionId: string;
  nextFactionId: string | null;
  nextWorldTension: number;
  escalationRisk: number;
  outcome: Game["state"]["derived"]["outcome"];
  isCompleted: boolean;
}) {
  if (input.isCompleted) {
    return input.outcome.summary ?? input.state.privateBriefing;
  }

  const snapshot = buildFactionStrategicSnapshot({
    scenario: input.scenario,
    game: input.game,
    factionId: input.state.factionId
  });
  const actingFactionName = getFactionName(input.game, input.actionFactionId);
  const nextFactionName = getFactionName(input.game, input.nextFactionId);
  const ownProgress = snapshot.ownProgress;
  const rivalProgress = snapshot.rivalProgress;

  if (input.state.factionId === input.actionFactionId) {
    return `${actingFactionName} just executed ${input.selectedOption.title}. Public tension is now ${input.nextWorldTension}% and escalation risk is ${input.escalationRisk}%. Your visible objective pressure is ${ownProgress}% against ${rivalProgress}% for the rival, so the next exchange should follow a ${snapshot.doctrine.doctrineLabel} approach rather than drift into reactive play.`;
  }

  if (input.state.factionId === input.nextFactionId) {
    return `${nextFactionName} now faces the next decision window after ${actingFactionName} chose ${input.selectedOption.title}. Public tension is ${input.nextWorldTension}% with escalation risk at ${input.escalationRisk}%, so this is a moment to apply ${snapshot.doctrine.doctrineLabel} instead of making a generic reply.`;
  }

  return `${input.scenario.title} remains unresolved. ${actingFactionName}'s latest move changed the public balance, and ${nextFactionName} now controls the next choice.`;
}

function buildPrivateIntelligence(input: {
  state: Game["state"]["privateByPlayer"][number];
  game: Game;
  scenario: ResolveTurnInput["scenario"];
  selectedOption: ChoiceOption;
  actionFactionId: string;
  nextFactionId: string | null;
  nextWorldTension: number;
  escalationRisk: number;
  outcome: Game["state"]["derived"]["outcome"];
  nextVisibleTracks: Record<string, number>;
  isCompleted: boolean;
}) {
  if (input.isCompleted) {
    return input.state.intelligence;
  }

  const snapshot = buildFactionStrategicSnapshot({
    scenario: input.scenario,
    game: input.game,
    factionId: input.state.factionId
  });
  const ownProgress = snapshot.ownProgress;
  const rivalProgress = snapshot.rivalProgress;
  const pressureTrend =
    input.nextVisibleTracks.diplomaticPressure !== undefined
      ? `Diplomatic pressure now sits at ${input.nextVisibleTracks.diplomaticPressure}%.`
      : `Military posture now sits at ${input.nextVisibleTracks.militaryPosture ?? 0}%.`;
  const postureLine =
    input.escalationRisk >= 70
      ? "The crisis is close to punishing any overt overreach."
      : input.nextWorldTension <= 50
        ? "There is still room for a calibrated move before the confrontation fully locks up."
        : "The crisis remains active enough for initiative to matter.";

  if (input.state.factionId === input.nextFactionId) {
    return [
      `${getFactionName(input.game, input.actionFactionId)} just created a new decision problem with ${input.selectedOption.title}.`,
      `${pressureTrend} ${postureLine}`,
      `Your doctrine favors ${snapshot.doctrine.doctrineLabel}, so prefer categories like ${snapshot.doctrine.preferredCategories.join(", ")} before defaulting to raw escalation.`,
      `Visible objective pressure is ${ownProgress}% for your side versus ${rivalProgress}% for the rival.`
    ];
  }

  if (input.state.factionId === input.actionFactionId) {
    return [
      `${input.selectedOption.title} is now shaping the public board at ${input.nextWorldTension}% world tension.`,
      `${pressureTrend} Escalation risk is ${input.escalationRisk}%.`,
      `The move aligned with a ${snapshot.doctrine.doctrineLabel} posture and should be judged against that doctrine, not just the raw track deltas.`,
      `Your side's visible objective pressure is ${ownProgress}% against ${rivalProgress}% for the rival.`
    ];
  }

  return [
    `${getFactionName(input.game, input.nextFactionId)} controls the next move.`,
    `${pressureTrend} Escalation risk is ${input.escalationRisk}%.`
  ];
}

function getNextFactionInOrder(game: Game, actingFactionId: string): string | null {
  const playableFactionOrder = game.players
    .map((player) => player.factionId)
    .filter((factionId): factionId is string => Boolean(factionId));
  const currentIndex = playableFactionOrder.findIndex(
    (factionId) => factionId === actingFactionId
  );

  return currentIndex >= 0
    ? playableFactionOrder[(currentIndex + 1) % playableFactionOrder.length] ?? null
    : game.currentFactionId;
}

export class ProviderBackedTurnResolutionService implements TurnResolutionService {
  constructor(
    private readonly provider: TurnGenerationProvider,
    private readonly now: () => string
  ) {}

  async resolveTurn(input: ResolveTurnInput): Promise<ResolveTurnResult> {
    const prepared = this.prepareTurnContext(input);
    const publicView = projectSessionForSelection(input.game, {
      view: "public"
    });
    const actingFactionView = projectSessionForSelection(input.game, {
      playerId: input.action.playerId,
      factionId: input.action.factionId,
      view: "faction"
    });
    const escalationRisk = clampPercentage(
      input.game.state.derived.escalationRiskPercent +
        Math.round(prepared.tensionDelta / 2) +
        prepared.selectedOption.effectProfile.escalationRiskDelta
    );
    const nextPublicFlags = applyStringAddsAndRemoves({
      current: input.game.state.public.publicFlags,
      adds: prepared.selectedOption.effectProfile.publicFlagAdds,
      removes: prepared.selectedOption.effectProfile.publicFlagRemoves
    });
    const nextRevealedEvents = applyStringAddsAndRemoves({
      current: input.game.state.public.revealedEvents,
      adds: prepared.selectedOption.effectProfile.revealedEventAdds,
      removes: []
    });
    const nextVisibleTracks = applyStatDeltas(
      input.game.state.public.visibleTracks,
      prepared.selectedOption.effectProfile.visibleTrackDeltas
    );
    const nextNegotiationLeverage = applyStatDeltas(
      input.game.state.derived.negotiationLeverage,
      prepared.selectedOption.effectProfile.negotiationLeverageDeltas
    );
    const nextFactionMomentum = applyStatDeltas(
      input.game.state.derived.factionMomentum,
      prepared.selectedOption.effectProfile.factionMomentumDeltas
    );
    const eventState = applyScenarioEvents({
      scenario: input.scenario,
      selectedOption: prepared.selectedOption,
      state: {
        roundNumber: prepared.nextTurnNumber,
        worldTension: prepared.nextWorldTension,
        escalationRiskPercent: escalationRisk,
        visibleTracks: nextVisibleTracks,
        publicFlags: nextPublicFlags,
        revealedEvents: nextRevealedEvents,
        warnings: [
          ...input.game.state.derived.warnings,
          ...prepared.selectedOption.effectProfile.warningAdds
        ]
      }
    });
    const sessionOutcome = evaluateSessionOutcome({
      scenario: input.scenario,
      targetGameLength: input.game.sessionConfig.targetGameLength,
      turnNumber: prepared.nextTurnNumber,
      worldTension: eventState.worldTension,
      escalationRiskPercent: eventState.escalationRiskPercent,
      visibleTracks: eventState.visibleTracks,
      publicFlags: eventState.publicFlags,
      revealedEvents: eventState.revealedEvents,
      negotiationLeverage: nextNegotiationLeverage,
      factionMomentum: nextFactionMomentum,
      selectedOption: prepared.selectedOption
    });
    const actingPrivateMetadata = prepared.actingPrivateState.metadata ?? {};
    const nextActingPrivateMetadata = recordOptionUsageInPrivateStateMetadata({
      metadata: actingPrivateMetadata,
      optionId: prepared.selectedOption.id,
      roundNumber: prepared.roundNumber
    });
    const evolvedPrivateStates = evolvePrivateStatesAfterAction({
      game: input.game,
      scenario: input.scenario,
      actingFactionId: input.action.factionId,
      selectedOption: prepared.selectedOption,
      nextWorldTension: eventState.worldTension,
      escalationRisk: eventState.escalationRiskPercent
    });
    const curatedNextOptions = buildAvailableOptions({
      scenario: input.scenario,
      factionId: prepared.nextFactionId,
      publicState: {
        worldTension: eventState.worldTension,
        visibleTracks: eventState.visibleTracks,
        publicFlags: eventState.publicFlags,
        revealedEvents: eventState.revealedEvents
      },
      privateState: findPrivateStateInCollection(evolvedPrivateStates, prepared.nextFactionId),
      derivedState: {
        escalationRiskPercent: eventState.escalationRiskPercent,
        negotiationLeverage: nextNegotiationLeverage,
        factionMomentum: nextFactionMomentum,
        outcome: sessionOutcome
      },
      targetGameLength: input.game.sessionConfig.targetGameLength,
      currentRound: prepared.nextTurnNumber,
      limit: 4
    });
    const rawArtifacts = await this.provider.generateTurnArtifacts({
      ...input,
      publicView,
      actingFactionView,
      targetGameLength: input.game.sessionConfig.targetGameLength,
      ...prepared,
      nextOptions: curatedNextOptions
    });
    const artifacts = turnGenerationArtifactsSchema.parse(rawArtifacts);
    const recommendedNextOptionIds = artifacts.recommendedNextOptionIds ?? [];
    const recommendedOptionNotes = artifacts.recommendedOptionNotes ?? [];
    const worldUpdateSuggestions = artifacts.worldUpdateSuggestions ?? [];
    const privateSummaries = sanitizePrivateSummaries({
      privateSummaries: artifacts.privateSummaries,
      actingPlayerId: prepared.actingPlayer.id,
      actingFactionId: input.action.factionId
    });
    const narrativePrivateUpdates = sanitizeNarrativePrivateUpdates({
      privateUpdates: artifacts.llmNarrative.privateUpdates,
      actingFactionId: input.action.factionId
    });
    const validatedRecommendedNextOptionIds = curatedNextOptions
      .map((candidate) => candidate.id)
      .filter((optionId) => recommendedNextOptionIds.includes(optionId));
    const validatedRecommendedOptionNotes = recommendedOptionNotes.filter((note) =>
      curatedNextOptions.some((candidate) => candidate.id === note.optionId)
    );
    const generatedResolutionId = generateSessionScopedId({
      sessionConfig: input.game.sessionConfig,
      stream: "turn-resolution"
    });

    const resolution = turnResolutionSchema.parse({
      id: generatedResolutionId.id,
      gameId: input.game.id,
      turnNumber: input.game.turnNumber,
      actionId: input.action.id,
      status: "resolved",
      appliedOptionId: prepared.selectedOption.id,
      actingFactionId: input.action.factionId,
      actor: {
        playerId: prepared.actingPlayer.id,
        playerName: prepared.actingPlayer.name,
        playerRole: prepared.actingPlayer.role,
        factionId: input.action.factionId
      },
      selectedAction: {
        optionId: prepared.selectedOption.id,
        title: prepared.selectedOption.title,
        kind: prepared.selectedOption.kind,
        recommendationPercent: prepared.selectedOption.recommendationPercent ?? null
      },
      publicSummary: artifacts.publicSummary,
      privateSummaries,
      effects: artifacts.effects,
      stateChanges: [
        {
          key: "worldTension",
          label: "World Tension",
          previousValue: input.game.state.public.worldTension,
          newValue: eventState.worldTension,
          delta: eventState.worldTension - input.game.state.public.worldTension,
          visibility: "public"
        },
        {
          key: "escalationRiskPercent",
          label: "Escalation Risk",
          previousValue: input.game.state.derived.escalationRiskPercent,
          newValue: eventState.escalationRiskPercent,
          delta:
            eventState.escalationRiskPercent -
            input.game.state.derived.escalationRiskPercent,
          visibility: "derived"
        },
        ...Object.entries(prepared.selectedOption.effectProfile.visibleTrackDeltas).map(
          ([key, delta]) => ({
            key,
            label: key,
            previousValue: input.game.state.public.visibleTracks[key] ?? 0,
            newValue: nextVisibleTracks[key] ?? 0,
            delta,
            visibility: "public" as const
          })
        ),
        ...Object.entries(prepared.selectedOption.effectProfile.negotiationLeverageDeltas).map(
          ([key, delta]) => ({
            key: `negotiationLeverage.${key}`,
            label: `Negotiation leverage (${key})`,
            previousValue: input.game.state.derived.negotiationLeverage[key] ?? 0,
            newValue: nextNegotiationLeverage[key] ?? 0,
            delta,
            visibility: "derived" as const
          })
        ),
        ...Object.entries(prepared.selectedOption.effectProfile.factionMomentumDeltas).map(
          ([key, delta]) => ({
            key: `factionMomentum.${key}`,
            label: `Faction momentum (${key})`,
            previousValue: input.game.state.derived.factionMomentum[key] ?? 0,
            newValue: nextFactionMomentum[key] ?? 0,
            delta,
            visibility: "derived" as const
          })
        )
      ],
      updatedTracks: {
        ...eventState.visibleTracks,
        worldTension: eventState.worldTension
      },
      escalated: prepared.tensionDelta >= 10,
      sessionOutcome,
      recommendationLabels: artifacts.recommendationLabels,
      riskLabels: artifacts.riskLabels,
      llmNarrative: {
        ...artifacts.llmNarrative,
        privateUpdates: narrativePrivateUpdates
      },
      progression: {
        roundNumber: prepared.roundNumber,
        roundActionIndex: prepared.roundActionIndex,
        roundActionCount: prepared.roundActionCount,
        advancesRound: prepared.advancesRound,
        nextRoundNumber: prepared.nextTurnNumber
      },
      resolvedAt: prepared.resolvedAt,
      metadata: {
        ...artifacts.metadata,
        turnProviderRecommendedNextOptionIds: validatedRecommendedNextOptionIds,
        worldUpdateSuggestions,
        triggeredScenarioEventIds: eventState.triggeredEventIds,
        integrationReady: "provider-turn-generation"
      }
    });

    logInfo("Turn artifacts validated.", {
      providerResult: String(artifacts.metadata.provider ?? "unknown"),
      usedFallback: Boolean(artifacts.metadata.fallbackProvider),
      gameId: input.game.id,
      turnNumber: input.game.turnNumber,
      actionId: input.action.id
    });

    const updatedGame = this.applyValidatedArtifacts({
      game: input.game,
      scenario: input.scenario,
      actionFactionId: input.action.factionId,
      prepared,
      sessionConfig: generatedResolutionId.sessionConfig,
      recommendedNextOptionIds: validatedRecommendedNextOptionIds,
      recommendedOptionNotes: validatedRecommendedOptionNotes,
      nextWorldTension: eventState.worldTension,
      escalationRisk: eventState.escalationRiskPercent,
      nextVisibleTracks: eventState.visibleTracks,
      nextPublicFlags: eventState.publicFlags,
      nextRevealedEvents: eventState.revealedEvents,
      nextWarnings: eventState.warnings,
      evolvedPrivateStates,
      nextActingPrivateMetadata,
      nextNegotiationLeverage,
      nextFactionMomentum,
      sessionOutcome,
      resolution
    });

    return {
      updatedGame,
      resolution
    };
  }

  private prepareTurnContext(input: ResolveTurnInput): PreparedTurnContext {
    const actingPrivateState = input.game.state.privateByPlayer.find(
      (state) => state.playerId === input.action.playerId
    );
    const actingPlayer = input.game.players.find(
      (player) => player.id === input.action.playerId
    );
    const selectedOption = actingPrivateState?.availableOptions.find(
      (candidate) => candidate.id === input.action.optionId
    );

    if (!actingPrivateState || !selectedOption || !actingPlayer) {
      throw new ValidationError(
        `Option ${input.action.optionId} is not legal for this turn.`
      );
    }

    const progression = input.game.progression ?? {
      model: input.game.mode === "solo" ? "solo_round" : "per_action",
      currentRound: input.game.turnNumber,
      currentRoundActionIndex: 1,
      roundActionCount: input.game.mode === "solo" ? 2 : 1,
      completedRoundCount: Math.max(0, input.game.turnNumber - 1)
    };
    const roundNumber = progression.currentRound;
    const roundActionIndex = progression.currentRoundActionIndex;
    const roundActionCount = progression.roundActionCount;
    const defaultNextFactionId = getNextFactionInOrder(input.game, input.action.factionId);
    let nextFactionId = defaultNextFactionId;
    let nextTurnNumber = input.game.turnNumber + 1;
    let nextCompletedRoundCount = progression.completedRoundCount + 1;
    let nextRoundActionIndex = 1;
    let advancesRound = true;

    if (input.game.mode === "solo") {
      const humanFactionId =
        input.game.players.find((player) => player.role === "human")?.factionId ??
        defaultNextFactionId;
      const aiFactionId =
        input.game.players.find((player) => player.role === "ai")?.factionId ??
        defaultNextFactionId;

      advancesRound = actingPlayer.role === "ai" || roundActionIndex >= roundActionCount;
      nextFactionId = advancesRound ? humanFactionId : aiFactionId;
      nextTurnNumber = advancesRound ? input.game.turnNumber + 1 : input.game.turnNumber;
      nextCompletedRoundCount = advancesRound
        ? progression.completedRoundCount + 1
        : progression.completedRoundCount;
      nextRoundActionIndex = advancesRound ? 1 : roundActionIndex + 1;
    }

    const fallbackTensionDelta =
      selectedOption.kind === "military_signal"
        ? 12
        : selectedOption.kind === "economic"
          ? 7
          : 4;
    const tensionDelta =
      selectedOption.effectProfile.worldTensionDelta !== 0
        ? selectedOption.effectProfile.worldTensionDelta
        : fallbackTensionDelta;
    const nextWorldTension = clampPercentage(
      input.game.state.public.worldTension + tensionDelta
    );
    return {
      actingPlayer,
      actingPrivateState,
      selectedOption,
      nextFactionId,
      nextTurnNumber,
      nextCompletedRoundCount,
      nextRoundActionIndex,
      roundNumber,
      roundActionIndex,
      roundActionCount,
      advancesRound,
      tensionDelta,
      nextWorldTension,
      resolvedAt: this.now()
    };
  }

  private applyValidatedArtifacts(input: {
    game: Game;
    scenario: ResolveTurnInput["scenario"];
    actionFactionId: string;
    prepared: PreparedTurnContext;
    sessionConfig: Game["sessionConfig"];
    recommendedNextOptionIds: string[];
    recommendedOptionNotes: Array<{ optionId: string; rationale: string }>;
    nextWorldTension: number;
    escalationRisk: number;
    nextVisibleTracks: Record<string, number>;
    nextPublicFlags: string[];
    nextRevealedEvents: string[];
    nextWarnings: string[];
    evolvedPrivateStates: Game["state"]["privateByPlayer"];
    nextActingPrivateMetadata: Record<string, unknown>;
    nextNegotiationLeverage: Record<string, number>;
    nextFactionMomentum: Record<string, number>;
    sessionOutcome: Game["state"]["derived"]["outcome"];
    resolution: ResolveTurnResult["resolution"];
  }): Game {
    const { game, prepared, resolution, scenario } = input;
    const isCompleted = input.sessionOutcome.status === "ended";
    const nextFactionId = isCompleted ? null : prepared.nextFactionId;
    const nextAvailableOptions =
      !isCompleted && nextFactionId
        ? buildAvailableOptions({
            scenario,
            factionId: nextFactionId,
            publicState: {
              worldTension: input.nextWorldTension,
              visibleTracks: input.nextVisibleTracks,
              publicFlags: input.nextPublicFlags,
              revealedEvents: input.nextRevealedEvents
            },
            privateState: findPrivateStateInCollection(
              input.evolvedPrivateStates,
              nextFactionId
            ),
            derivedState: {
              escalationRiskPercent: input.escalationRisk,
              negotiationLeverage: input.nextNegotiationLeverage,
              factionMomentum: input.nextFactionMomentum,
              outcome: input.sessionOutcome
            },
            targetGameLength: game.sessionConfig.targetGameLength,
            currentRound: prepared.nextTurnNumber,
            recommendationNotes: input.recommendedOptionNotes,
            limit: 4
          })
        : [];
    const nextWarnings = [
      ...input.nextWarnings,
      ...(resolution.escalated ? ["Recent action increased escalation pressure."] : [])
    ];
    const uniqueWarnings = [...new Set(nextWarnings)];

    return gameSchema.parse({
      ...game,
      status: isCompleted ? "completed" : game.status,
      turnNumber: prepared.nextTurnNumber,
      phase: isCompleted ? "turn_complete" : "briefing",
      currentFactionId: nextFactionId,
      state: {
        public: {
          ...game.state.public,
          turnNumber: prepared.nextTurnNumber,
          phase: isCompleted ? "turn_complete" : "briefing",
          activeFactionId: nextFactionId,
          worldTension: input.nextWorldTension,
          publicNarrative: resolution.llmNarrative.publicSummary,
          headline: resolution.llmNarrative.headline,
          visibleTracks: input.nextVisibleTracks,
          publicFlags: input.nextPublicFlags,
          revealedEvents: input.nextRevealedEvents,
          updatedAt: prepared.resolvedAt
        },
        privateByPlayer: input.evolvedPrivateStates.map((state) => ({
          ...state,
          turnNumber: prepared.nextTurnNumber,
          metadata:
            state.playerId === prepared.actingPlayer.id
              ? input.nextActingPrivateMetadata
              : state.metadata,
          privateBriefing: buildPrivateBriefing({
            state,
            game,
            scenario,
            selectedOption: prepared.selectedOption,
            actionFactionId: input.actionFactionId,
            nextFactionId: prepared.nextFactionId,
            nextWorldTension: input.nextWorldTension,
            escalationRisk: input.escalationRisk,
            outcome: input.sessionOutcome,
            isCompleted
          }),
          intelligence: buildPrivateIntelligence({
            state,
            game,
            scenario,
            selectedOption: prepared.selectedOption,
            actionFactionId: input.actionFactionId,
            nextFactionId: prepared.nextFactionId,
            nextWorldTension: input.nextWorldTension,
            escalationRisk: input.escalationRisk,
            outcome: input.sessionOutcome,
            nextVisibleTracks: input.nextVisibleTracks,
            isCompleted
          }),
          availableOptions:
            !isCompleted && state.factionId === prepared.nextFactionId ? nextAvailableOptions : []
        })),
        derived: {
          ...game.state.derived,
          turnNumber: prepared.nextTurnNumber,
          actingPlayerIds: game.players
            .filter((player) => player.factionId === nextFactionId)
            .map((player) => player.id),
          legalActionIds: isCompleted ? [] : nextAvailableOptions.map((candidate) => candidate.id),
          recommendedActionIds:
            isCompleted
              ? []
              : input.recommendedNextOptionIds.length > 0
              ? input.recommendedNextOptionIds
              : nextAvailableOptions
                  .filter((candidate) => (candidate.recommendationPercent ?? 0) >= 60)
                  .map((candidate) => candidate.id),
          escalationRiskPercent: input.escalationRisk,
          negotiationLeverage: input.nextNegotiationLeverage,
          factionMomentum: input.nextFactionMomentum,
          outcome: input.sessionOutcome,
          warnings: uniqueWarnings
        }
      },
      progression: {
        ...game.progression,
        currentRound: prepared.nextTurnNumber,
        currentRoundActionIndex: isCompleted ? 1 : prepared.nextRoundActionIndex,
        roundActionCount: game.mode === "solo" ? 2 : 1,
        completedRoundCount: isCompleted
          ? prepared.nextCompletedRoundCount
          : prepared.nextCompletedRoundCount
      },
      advisorAnswers: [],
      lastResolution: resolution,
      sessionConfig: input.sessionConfig,
      updatedAt: prepared.resolvedAt
    });
  }
}
