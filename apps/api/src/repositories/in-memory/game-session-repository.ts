import { gameSchema, type Game } from "@wargame/shared";
import type { GameSessionRepository } from "../contracts.js";
import type { InMemoryStore } from "./store.js";

export class InMemoryGameSessionRepository implements GameSessionRepository {
  constructor(private readonly store: InMemoryStore) {}

  async listSessions(): Promise<Game[]> {
    return Array.from(this.store.sessions.values()).map((session) =>
      gameSchema.parse(session)
    );
  }

  async getSessionById(sessionId: string): Promise<Game | null> {
    const session = this.store.sessions.get(sessionId);
    return session ? gameSchema.parse(session) : null;
  }

  async saveSession(session: Game): Promise<void> {
    this.store.sessions.set(session.id, gameSchema.parse(session));
  }
}
