import type {
  AdvisorContextRepository,
  GameSessionRepository
} from "./contracts.js";
import { buildAdvisorVisibleContext } from "./session-visibility-projection.js";

export class RepositoryBackedAdvisorContextRepository
  implements AdvisorContextRepository
{
  constructor(private readonly gameSessionRepository: GameSessionRepository) {}

  async getAdvisorContext(input: {
    sessionId: string;
    playerId?: string;
    factionId?: string | null;
  }) {
    const session = await this.gameSessionRepository.getSessionById(input.sessionId);

    if (!session) {
      return null;
    }

    return buildAdvisorVisibleContext(session, input);
  }
}
