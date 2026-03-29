import type { AdvisorContextRepository } from "../contracts.js";
import type { GameSessionRepository } from "../contracts.js";

export class InMemoryAdvisorContextRepository implements AdvisorContextRepository {
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

    const privateState = session.state.privateByPlayer.find((state) => {
      if (input.playerId) {
        return state.playerId === input.playerId;
      }

      if (input.factionId) {
        return state.factionId === input.factionId;
      }

      return false;
    });

    return {
      gameId: session.id,
      turnNumber: session.turnNumber,
      factionId: input.factionId ?? null,
      playerId: input.playerId,
      publicState: session.state.public,
      visibleOptions: privateState?.availableOptions ?? [],
      visibleWarnings: session.state.derived.warnings,
      lastAdvisorAnswer: session.advisorAnswers.at(-1) ?? null
    };
  }
}
