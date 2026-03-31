import {
  advisorAnswerSchema,
  gameSchema,
  canUserAccessGame,
  isPlayerControlledByUser
} from "@wargame/shared";
import { ForbiddenError, NotFoundError } from "../errors/app-error.js";
import type {
  AdvisorContextRepository,
  GameSessionRepository,
  ScenarioRepository
} from "../repositories/contracts.js";
import { generateSessionScopedId } from "./session-debug-service.js";
import type { AdvisorService } from "./types.js";

export class AdvisorQaService {
  constructor(
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly advisorContextRepository: AdvisorContextRepository,
    private readonly advisorService: AdvisorService,
    private readonly now: () => string
  ) {}

  async askQuestion(input: {
    sessionId: string;
    requestUserId: string;
    playerId?: string;
    factionId?: string | null;
    question: string;
  }) {
    const game = await this.gameSessionRepository.getSessionById(input.sessionId);

    if (!game) {
      throw new NotFoundError(`Game ${input.sessionId} was not found.`);
    }

    if (!canUserAccessGame(game, input.requestUserId)) {
      throw new ForbiddenError(
        `User ${input.requestUserId} cannot access game ${input.sessionId}.`
      );
    }

    if (
      input.playerId &&
      !game.players.some(
        (player) => player.id === input.playerId && isPlayerControlledByUser(player, input.requestUserId)
      )
    ) {
      throw new ForbiddenError(
        `User ${input.requestUserId} cannot act as player ${input.playerId}.`
      );
    }

    const scenario = await this.scenarioRepository.getScenarioById(game.scenarioId);

    if (!scenario) {
      throw new NotFoundError(`Scenario ${game.scenarioId} was not found.`);
    }

    const context = await this.advisorContextRepository.getAdvisorContext({
      sessionId: input.sessionId,
      playerId: input.playerId,
      factionId: input.factionId ?? game.currentFactionId
    });

    if (!context) {
      throw new NotFoundError(`Game ${input.sessionId} was not found.`);
    }

    const generatedAnswerId = generateSessionScopedId({
      sessionConfig: game.sessionConfig,
      stream: "advisor-answer"
    });

    const answer = await this.advisorService.generateAdvisorAnswer({
      scenario,
      targetGameLength: game.sessionConfig.targetGameLength,
      question: input.question,
      context,
      answerId: generatedAnswerId.id
    });

    const updatedGame = gameSchema.parse({
      ...game,
      sessionConfig: generatedAnswerId.sessionConfig,
      advisorAnswers: [...game.advisorAnswers, answer],
      updatedAt: this.now()
    });

    await this.gameSessionRepository.saveSession(updatedGame);

    return advisorAnswerSchema.parse(answer);
  }
}
