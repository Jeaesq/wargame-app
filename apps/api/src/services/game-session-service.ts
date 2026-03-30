import { gameSchema, type CreateGameRequest, type Game } from "@wargame/shared";
import { ForbiddenError, NotFoundError } from "../errors/app-error.js";
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

  async listSessions(userId: string): Promise<Game[]> {
    const sessions = await this.gameSessionRepository.listSessions();

    return sessions
      .filter((session) => this.canUserAccessSession(session, userId))
      .map((session) =>
        gameSchema.parse(projectSessionForSelection(session, { view: "public" }))
      );
  }

  async getSession(
    sessionId: string,
    userId: string,
    selection: SessionViewSelection = {}
  ): Promise<Game> {
    const canonicalSession = await this.gameSessionRepository.getSessionById(sessionId);

    if (!canonicalSession) {
      throw new NotFoundError(`Game ${sessionId} was not found.`);
    }

    if (!this.canUserAccessSession(canonicalSession, userId)) {
      throw new ForbiddenError(`User ${userId} cannot access game ${sessionId}.`);
    }

    const effectiveSelection = this.resolveDefaultSelectionForUser(
      canonicalSession,
      userId,
      selection
    );
    const session = await this.sessionViewRepository.getSessionForPlayerView({
      sessionId,
      ...effectiveSelection
    });

    if (!session) {
      throw new NotFoundError(`Game ${sessionId} was not found.`);
    }

    return gameSchema.parse(session);
  }

  async createSession(input: CreateGameRequest, ownerUserId: string): Promise<Game> {
    const scenario = await this.scenarioRepository.getScenarioById(input.scenarioId);

    if (!scenario) {
      throw new NotFoundError(`Scenario ${input.scenarioId} was not found.`);
    }

    const session = buildGameFromScenario({
      now: this.now(),
      ownerUserId,
      scenario,
      mode: input.mode,
      requestedPlayers: input.players,
      targetGameLength: input.targetGameLength
    });

    await this.gameSessionRepository.saveSession(session);

    return gameSchema.parse(
      projectSessionForSelection(
        session,
        this.resolveDefaultSelectionForUser(session, ownerUserId, {})
      )
    );
  }

  private canUserAccessSession(session: Game, userId: string): boolean {
    return (
      session.ownerUserId === userId ||
      session.players.some((player) => player.userId === userId)
    );
  }

  private resolveDefaultSelectionForUser(
    session: Game,
    userId: string,
    selection: SessionViewSelection
  ): SessionViewSelection {
    if (selection.playerId || selection.factionId || selection.view) {
      return selection;
    }

    const userPlayers = session.players.filter((player) => player.userId === userId);

    if (userPlayers.length === 1) {
      return {
        playerId: userPlayers[0]?.id,
        factionId: userPlayers[0]?.factionId ?? null
      };
    }

    return selection;
  }
}
