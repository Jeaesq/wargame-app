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
import { buildAvailableOptions } from "./option-presentation-service.js";
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
    const sessionOutcome = evaluateSessionOutcome({
      scenario: input.scenario,
      targetGameLength: input.game.sessionConfig.targetGameLength,
      turnNumber: prepared.nextTurnNumber,
      worldTension: prepared.nextWorldTension,
      escalationRiskPercent: escalationRisk,
      visibleTracks: nextVisibleTracks,
      negotiationLeverage: nextNegotiationLeverage,
      factionMomentum: nextFactionMomentum,
      selectedOption: prepared.selectedOption
    });
    const curatedNextOptions = buildAvailableOptions({
      scenario: input.scenario,
      factionId: prepared.nextFactionId,
      publicState: {
        worldTension: prepared.nextWorldTension,
        visibleTracks: nextVisibleTracks
      },
      derivedState: {
        escalationRiskPercent: escalationRisk,
        negotiationLeverage: nextNegotiationLeverage,
        factionMomentum: nextFactionMomentum,
        outcome: sessionOutcome
      },
      targetGameLength: input.game.sessionConfig.targetGameLength,
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
          newValue: prepared.nextWorldTension,
          delta: prepared.nextWorldTension - input.game.state.public.worldTension,
          visibility: "public"
        },
        {
          key: "escalationRiskPercent",
          label: "Escalation Risk",
          previousValue: input.game.state.derived.escalationRiskPercent,
          newValue: escalationRisk,
          delta: escalationRisk - input.game.state.derived.escalationRiskPercent,
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
        ...nextVisibleTracks,
        worldTension: prepared.nextWorldTension
      },
      escalated: prepared.tensionDelta >= 10,
      sessionOutcome,
      recommendationLabels: artifacts.recommendationLabels,
      riskLabels: artifacts.riskLabels,
      llmNarrative: {
        ...artifacts.llmNarrative,
        privateUpdates: narrativePrivateUpdates
      },
      resolvedAt: prepared.resolvedAt,
      metadata: {
        ...artifacts.metadata,
        turnProviderRecommendedNextOptionIds: validatedRecommendedNextOptionIds,
        worldUpdateSuggestions,
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
      escalationRisk,
      nextVisibleTracks,
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

    const playableFactionOrder = input.game.players
      .map((player) => player.factionId)
      .filter((factionId): factionId is string => Boolean(factionId));
    const currentIndex = playableFactionOrder.findIndex(
      (factionId) => factionId === input.action.factionId
    );
    const nextFactionId =
      currentIndex >= 0
        ? playableFactionOrder[(currentIndex + 1) % playableFactionOrder.length]
        : input.game.currentFactionId;
    const nextTurnNumber = input.game.turnNumber + 1;
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
    escalationRisk: number;
    nextVisibleTracks: Record<string, number>;
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
              worldTension: prepared.nextWorldTension,
              visibleTracks: input.nextVisibleTracks
            },
            derivedState: {
              escalationRiskPercent: input.escalationRisk,
              negotiationLeverage: input.nextNegotiationLeverage,
              factionMomentum: input.nextFactionMomentum,
              outcome: input.sessionOutcome
            },
            targetGameLength: game.sessionConfig.targetGameLength,
            recommendationNotes: input.recommendedOptionNotes,
            limit: 4
          })
        : [];
    const nextWarnings = [
      ...game.state.derived.warnings,
      ...prepared.selectedOption.effectProfile.warningAdds,
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
          worldTension: prepared.nextWorldTension,
          publicNarrative: resolution.llmNarrative.publicSummary,
          headline: resolution.llmNarrative.headline,
          visibleTracks: input.nextVisibleTracks,
          publicFlags: applyStringAddsAndRemoves({
            current: game.state.public.publicFlags,
            adds: prepared.selectedOption.effectProfile.publicFlagAdds,
            removes: prepared.selectedOption.effectProfile.publicFlagRemoves
          }),
          revealedEvents: applyStringAddsAndRemoves({
            current: game.state.public.revealedEvents,
            adds: prepared.selectedOption.effectProfile.revealedEventAdds,
            removes: []
          }),
          updatedAt: prepared.resolvedAt
        },
        privateByPlayer: game.state.privateByPlayer.map((state) => ({
          ...state,
          turnNumber: prepared.nextTurnNumber,
          privateBriefing:
            isCompleted
              ? input.sessionOutcome.summary ?? state.privateBriefing
              : state.factionId === prepared.nextFactionId
              ? `Prepare for the next move. ${scenario.title} remains unresolved.`
              : state.factionId === input.actionFactionId
                ? `Post-action assessment: ${prepared.selectedOption.title} increased pressure and drew fresh scrutiny.`
                : state.privateBriefing,
          intelligence:
            !isCompleted && state.factionId === prepared.nextFactionId
              ? [
                  `Placeholder intelligence: ${prepared.nextFactionId} now faces the next decision window.`,
                  `Current world tension stands at ${prepared.nextWorldTension}%.`
                ]
              : state.intelligence,
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
      advisorAnswers: [],
      lastResolution: resolution,
      sessionConfig: input.sessionConfig,
      updatedAt: prepared.resolvedAt
    });
  }
}
