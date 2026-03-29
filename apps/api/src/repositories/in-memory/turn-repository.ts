import {
  turnResolutionSchema,
  type TurnResolution
} from "@wargame/shared";
import type { TurnRepository } from "../contracts.js";
import type { InMemoryStore } from "./store.js";

export class InMemoryTurnRepository implements TurnRepository {
  constructor(private readonly store: InMemoryStore) {}

  async listTurnsBySessionId(sessionId: string): Promise<TurnResolution[]> {
    return (this.store.turnsBySession.get(sessionId) ?? []).map((turn) =>
      turnResolutionSchema.parse(turn)
    );
  }

  async appendTurn(sessionId: string, turn: TurnResolution): Promise<void> {
    const turns = this.store.turnsBySession.get(sessionId) ?? [];
    turns.push(turnResolutionSchema.parse(turn));
    this.store.turnsBySession.set(sessionId, turns);
  }
}
