import {
  gameSchema,
  turnGenerationArtifactsSchema,
  turnResolutionSchema,
  type ChoiceOption,
  type Game,
  type Player,
  type PrivatePlayerState
} from "@wargame/shared";
import { randomUUID } from "node:crypto";
import { ValidationError } from "../errors/app-error.js";
import type { TurnGenerationProvider } from "../providers/types.js";
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
  nextOptions: ChoiceOption[];
  resolvedAt: string;
};

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class ProviderBackedTurnResolutionService implements TurnResolutionService {
  constructor(
    private readonly provider: TurnGenerationProvider,
    private readonly now: () => string
  ) {}

  async resolveTurn(input: ResolveTurnInput): Promise<ResolveTurnResult> {
    const prepared = this.prepareTurnContext(input);
    const rawArtifacts = await this.provider.generateTurnArtifacts({
      ...input,
      targetGameLength: input.game.sessionConfig.targetGameLength,
      ...prepared
    });
    const artifacts = turnGenerationArtifactsSchema.parse(rawArtifacts);
    const recommendedNextOptionIds = artifacts.recommendedNextOptionIds ?? [];
    const worldUpdateSuggestions = artifacts.worldUpdateSuggestions ?? [];
    const validatedRecommendedNextOptionIds = prepared.nextOptions
      .map((candidate) => candidate.id)
      .filter((optionId) => recommendedNextOptionIds.includes(optionId));

    const escalationRisk = clampPercentage(
      input.game.state.derived.escalationRiskPercent +
        Math.round(prepared.tensionDelta / 2)
    );

    const resolution = turnResolutionSchema.parse({
      id: randomUUID(),
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
      privateSummaries: artifacts.privateSummaries,
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
        }
      ],
      updatedTracks: {
        ...input.game.state.public.visibleTracks,
        worldTension: prepared.nextWorldTension
      },
      escalated: prepared.tensionDelta >= 10,
      recommendationLabels: artifacts.recommendationLabels,
      riskLabels: artifacts.riskLabels,
      llmNarrative: artifacts.llmNarrative,
      resolvedAt: prepared.resolvedAt,
      metadata: {
        ...artifacts.metadata,
        turnProviderRecommendedNextOptionIds: validatedRecommendedNextOptionIds,
        worldUpdateSuggestions,
        integrationReady: "provider-turn-generation"
      }
    });

    const updatedGame = this.applyValidatedArtifacts({
      game: input.game,
      scenario: input.scenario,
      actionFactionId: input.action.factionId,
      prepared,
      recommendedNextOptionIds: validatedRecommendedNextOptionIds,
      escalationRisk,
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
    const tensionDelta =
      selectedOption.kind === "military_signal"
        ? 12
        : selectedOption.kind === "economic"
          ? 7
          : 4;
    const nextWorldTension = clampPercentage(
      input.game.state.public.worldTension + tensionDelta
    );
    const nextOptions = input.scenario.choiceCatalog.filter(
      (candidate) => candidate.factionId === nextFactionId
    );

    return {
      actingPlayer,
      actingPrivateState,
      selectedOption,
      nextFactionId,
      nextTurnNumber,
      tensionDelta,
      nextWorldTension,
      nextOptions,
      resolvedAt: this.now()
    };
  }

  private applyValidatedArtifacts(input: {
    game: Game;
    scenario: ResolveTurnInput["scenario"];
    actionFactionId: string;
    prepared: PreparedTurnContext;
    recommendedNextOptionIds: string[];
    escalationRisk: number;
    resolution: ResolveTurnResult["resolution"];
  }): Game {
    const { game, prepared, resolution, scenario } = input;

    return gameSchema.parse({
      ...game,
      turnNumber: prepared.nextTurnNumber,
      phase: "briefing",
      currentFactionId: prepared.nextFactionId,
      state: {
        public: {
          ...game.state.public,
          turnNumber: prepared.nextTurnNumber,
          phase: "briefing",
          activeFactionId: prepared.nextFactionId,
          worldTension: prepared.nextWorldTension,
          publicNarrative: resolution.llmNarrative.publicSummary,
          headline: resolution.llmNarrative.headline,
          updatedAt: prepared.resolvedAt
        },
        privateByPlayer: game.state.privateByPlayer.map((state) => ({
          ...state,
          turnNumber: prepared.nextTurnNumber,
          privateBriefing:
            state.factionId === prepared.nextFactionId
              ? `Prepare for the next move. ${scenario.title} remains unresolved.`
              : state.factionId === input.actionFactionId
                ? `Post-action assessment: ${prepared.selectedOption.title} increased pressure and drew fresh scrutiny.`
                : state.privateBriefing,
          intelligence:
            state.factionId === prepared.nextFactionId
              ? [
                  `Placeholder intelligence: ${prepared.nextFactionId} now faces the next decision window.`,
                  `Current world tension stands at ${prepared.nextWorldTension}%.`
                ]
              : state.intelligence,
          availableOptions:
            state.factionId === prepared.nextFactionId ? prepared.nextOptions : []
        })),
        derived: {
          ...game.state.derived,
          turnNumber: prepared.nextTurnNumber,
          actingPlayerIds: game.players
            .filter((player) => player.factionId === prepared.nextFactionId)
            .map((player) => player.id),
          legalActionIds: prepared.nextOptions.map((candidate) => candidate.id),
          recommendedActionIds:
            input.recommendedNextOptionIds.length > 0
              ? input.recommendedNextOptionIds
              : prepared.nextOptions
                  .filter((candidate) => (candidate.recommendationPercent ?? 0) >= 60)
                  .map((candidate) => candidate.id),
          escalationRiskPercent: input.escalationRisk,
          warnings: resolution.escalated
            ? [
                ...game.state.derived.warnings,
                "Recent action increased escalation pressure."
              ]
            : game.state.derived.warnings
        }
      },
      advisorAnswers: [],
      lastResolution: resolution,
      updatedAt: prepared.resolvedAt
    });
  }
}
