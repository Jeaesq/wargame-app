import { gameSchema, type Game } from "@wargame/shared";
import type {
  GameSessionRepository,
  SessionViewRepository
} from "./contracts.js";

export class RepositoryBackedSessionViewRepository implements SessionViewRepository {
  constructor(private readonly gameSessionRepository: GameSessionRepository) {}

  async getSessionForPlayerView(input: {
    sessionId: string;
    playerId?: string;
  }): Promise<Game | null> {
    const session = await this.gameSessionRepository.getSessionById(input.sessionId);
    return session ? gameSchema.parse(session) : null;
  }
}
