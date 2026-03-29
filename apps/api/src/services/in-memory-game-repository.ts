import { gameSchema, turnResolutionSchema, type Game, type TurnResolution } from "@wargame/shared";
import type { GameRepository } from "./types.js";

export class InMemoryGameRepository implements GameRepository {
  private readonly games = new Map<string, Game>();
  private readonly turns = new Map<string, TurnResolution[]>();

  async listGames(): Promise<Game[]> {
    return Array.from(this.games.values()).map((game) => gameSchema.parse(game));
  }

  async getGameById(gameId: string): Promise<Game | null> {
    const game = this.games.get(gameId);
    return game ? gameSchema.parse(game) : null;
  }

  async saveGame(game: Game): Promise<void> {
    this.games.set(game.id, gameSchema.parse(game));
  }

  async listTurnResolutions(gameId: string): Promise<TurnResolution[]> {
    return (this.turns.get(gameId) ?? []).map((turn) => turnResolutionSchema.parse(turn));
  }

  async appendTurnResolution(game: Game, resolution: TurnResolution): Promise<void> {
    await this.saveGame(game);

    const existingTurns = this.turns.get(game.id) ?? [];
    existingTurns.push(turnResolutionSchema.parse(resolution));
    this.turns.set(game.id, existingTurns);
  }
}
