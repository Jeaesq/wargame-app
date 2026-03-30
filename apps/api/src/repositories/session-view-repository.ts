import { gameSchema, type Game } from "@wargame/shared";
import type {
  GameSessionRepository,
  SessionViewRepository
} from "./contracts.js";
import { projectSessionForSelection } from "./session-visibility-projection.js";

export class RepositoryBackedSessionViewRepository implements SessionViewRepository {
  constructor(private readonly gameSessionRepository: GameSessionRepository) {}

  async getSessionForPlayerView(input: {
    sessionId: string;
    playerId?: string;
    factionId?: string | null;
    view?: "default" | "public" | "faction" | "system";
  }): Promise<Game | null> {
    const session = await this.gameSessionRepository.getSessionById(input.sessionId);

    return session ? gameSchema.parse(projectSessionForSelection(session, input)) : null;
  }
}
