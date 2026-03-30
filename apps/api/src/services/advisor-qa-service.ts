import { advisorAnswerSchema, gameSchema } from "@wargame/shared";
import { NotFoundError } from "../errors/app-error.js";
import type {
  AdvisorContextRepository,
  GameSessionRepository,
  ScenarioRepository
} from "../repositories/contracts.js";
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
    playerId?: string;
    factionId?: string | null;
    question: string;
  }) {
    const game = await this.gameSessionRepository.getSessionById(input.sessionId);

    if (!game) {
      throw new NotFoundError(`Game ${input.sessionId} was not found.`);
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

    const answer = await this.advisorService.generateAdvisorAnswer({
      scenario,
      targetGameLength: game.sessionConfig.targetGameLength,
      question: input.question,
      context
    });

    const updatedGame = gameSchema.parse({
      ...game,
      advisorAnswers: [...game.advisorAnswers, answer],
      updatedAt: this.now()
    });

    await this.gameSessionRepository.saveSession(updatedGame);

    return advisorAnswerSchema.parse(answer);
  }
}
