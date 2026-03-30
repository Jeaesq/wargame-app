import { gameSchema, type CreateGameRequest, type Game } from "@wargame/shared";
import { NotFoundError } from "../errors/app-error.js";
import type {
  GameSessionRepository,
  ScenarioRepository,
  SessionViewRepository,
  SessionViewSelection
} from "../repositories/contracts.js";
import { projectSessionForSelection } from "../repositories/session-visibility-projection.js";
import { buildGameFromScenario } from "./game-factory.js";

export class GameSessionService {
  constructor(
    private readonly gameSessionRepository: GameSessionRepository,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly sessionViewRepository: SessionViewRepository,
    private readonly now: () => string
  ) {}

  async listSessions(): Promise<Game[]> {
    const sessions = await this.gameSessionRepository.listSessions();

    return sessions.map((session) =>
      gameSchema.parse(projectSessionForSelection(session, { view: "public" }))
    );
  }

  async getSession(
    sessionId: string,
    selection: SessionViewSelection = {}
  ): Promise<Game> {
    const session = await this.sessionViewRepository.getSessionForPlayerView({
      sessionId,
      ...selection
    });

    if (!session) {
      throw new NotFoundError(`Game ${sessionId} was not found.`);
    }

    return gameSchema.parse(session);
  }

  async createSession(input: CreateGameRequest): Promise<Game> {
    const scenario = await this.scenarioRepository.getScenarioById(input.scenarioId);

    if (!scenario) {
      throw new NotFoundError(`Scenario ${input.scenarioId} was not found.`);
    }

    const session = buildGameFromScenario({
      now: this.now(),
      scenario,
      mode: input.mode,
      requestedPlayers: input.players,
      targetGameLength: input.targetGameLength
    });

    await this.gameSessionRepository.saveSession(session);

    return gameSchema.parse(projectSessionForSelection(session));
  }
}
