import {
  canUserAccessGame,
  isPlayerControlledByUser,
  turnActionSchema,
  turnResolutionSchema,
  type CreateTurnRequest,
  type Game,
  type TurnResolution
} from "@wargame/shared";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors/app-error.js";
import type {
  GameSessionRepository,
  ScenarioRepository,
  TurnRepository
} from "../repositories/contracts.js";
import { projectSessionForSelection } from "../repositories/session-visibility-projection.js";
import type {
  BotStrategyService,
  TurnResolutionService
} from "./types.js";
import { generateSessionScopedId } from "./session-debug-service.js";

export class TurnSubmissionService {
  constructor(
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly turnRepository: TurnRepository,
    private readonly turnResolutionService: TurnResolutionService,
    private readonly botStrategyService: BotStrategyService,
    private readonly now: () => string
  ) {}

  async listTurns(sessionId: string): Promise<TurnResolution[]> {
    return this.turnRepository.listTurnsBySessionId(sessionId);
  }

  async submitTurn(sessionId: string, requestUserId: string, input: CreateTurnRequest): Promise<{
    game: Game;
    resolution: TurnResolution;
    followupResolutions: TurnResolution[];
  }> {
    const game = await this.gameSessionRepository.getSessionById(sessionId);

    if (!game) {
      throw new NotFoundError(`Game ${sessionId} was not found.`);
    }

    if (!canUserAccessGame(game, requestUserId)) {
      throw new ForbiddenError(`User ${requestUserId} cannot access game ${sessionId}.`);
    }

    if (game.status === "completed" || game.state.derived.outcome.status === "ended") {
      throw new ValidationError(`Game ${sessionId} has already reached an end state.`);
    }

    const actingPlayer = game.players.find((player) => player.id === input.playerId);

    if (!actingPlayer || !isPlayerControlledByUser(actingPlayer, requestUserId)) {
      throw new ForbiddenError(
        `User ${requestUserId} cannot submit turns for player ${input.playerId}.`
      );
    }

    const scenario = await this.scenarioRepository.getScenarioById(game.scenarioId);

    if (!scenario) {
      throw new NotFoundError(`Scenario ${game.scenarioId} was not found.`);
    }

    const privateState = game.state.privateByPlayer.find(
      (state) => state.playerId === input.playerId
    );
    const option = privateState?.availableOptions.find(
      (candidate) => candidate.id === input.optionId
    );

    if (!option) {
      throw new ValidationError(`Option ${input.optionId} is not available this turn.`);
    }

    const generatedActionId = generateSessionScopedId({
      sessionConfig: game.sessionConfig,
      stream: "turn-action"
    });
    const action = turnActionSchema.parse({
      id: generatedActionId.id,
      gameId: game.id,
      turnNumber: game.turnNumber,
      playerId: input.playerId,
      factionId: input.factionId,
      optionId: input.optionId,
      kind: option.kind,
      submittedAt: this.now(),
      declaredIntent: input.declaredIntent,
      parameters: input.parameters,
      clientContext: input.clientContext
    });

    const result = await this.turnResolutionService.resolveTurn({
      game: {
        ...game,
        sessionConfig: generatedActionId.sessionConfig
      },
      scenario,
      action
    });

    const followupResolutions: TurnResolution[] = [];
    let currentGame = result.updatedGame;

    if (
      currentGame.mode === "solo" &&
      currentGame.status !== "completed" &&
      currentGame.currentFactionId
    ) {
      const botPlayer = currentGame.players.find(
        (player) =>
          player.role === "ai" && player.factionId === currentGame.currentFactionId
      );

      if (botPlayer?.factionId) {
        const botDecision = await this.botStrategyService.chooseAction({
          game: currentGame,
          scenario,
          factionId: botPlayer.factionId
        });

        if (botDecision) {
          const botPrivateState = currentGame.state.privateByPlayer.find(
            (state) => state.playerId === botPlayer.id
          );
          const botOption = botPrivateState?.availableOptions.find(
            (candidate) => candidate.id === botDecision.optionId
          );

          if (botOption) {
            const generatedBotActionId = generateSessionScopedId({
              sessionConfig: currentGame.sessionConfig,
              stream: "turn-action"
            });
            const botAction = turnActionSchema.parse({
              id: generatedBotActionId.id,
              gameId: currentGame.id,
              turnNumber: currentGame.turnNumber,
              playerId: botPlayer.id,
              factionId: botPlayer.factionId,
              optionId: botOption.id,
              kind: botOption.kind,
              submittedAt: this.now(),
              declaredIntent: botDecision.rationale,
              parameters: {},
              clientContext: {
                source: "static-bot"
              }
            });

            const botResult = await this.turnResolutionService.resolveTurn({
              game: {
                ...currentGame,
                sessionConfig: generatedBotActionId.sessionConfig
              },
              scenario,
              action: botAction
            });

            currentGame = botResult.updatedGame;
            followupResolutions.push(turnResolutionSchema.parse(botResult.resolution));
          }
        }
      }
    }

    await this.gameSessionRepository.saveSession(currentGame);
    await this.turnRepository.appendTurn(currentGame.id, result.resolution);

    for (const followupResolution of followupResolutions) {
      await this.turnRepository.appendTurn(currentGame.id, followupResolution);
    }

    const projectedGame = projectSessionForSelection(currentGame, {
      playerId: input.playerId,
      factionId: input.factionId,
      view: "faction"
    });

    return {
      game: projectedGame,
      resolution: turnResolutionSchema.parse(result.resolution),
      followupResolutions
    };
  }
}
