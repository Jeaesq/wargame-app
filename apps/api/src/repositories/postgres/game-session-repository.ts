import { gameSchema, type Game } from "@wargame/shared";
import type { Pool } from "pg";
import type { GameSessionRepository } from "../contracts.js";

type SessionRow = {
  game_data: unknown;
};

export class PostgresGameSessionRepository implements GameSessionRepository {
  constructor(private readonly pool: Pool) {}

  async listSessions(): Promise<Game[]> {
    const result = await this.pool.query<SessionRow>(
      `
        select game_data
        from game_sessions
        order by updated_at desc
      `
    );

    return result.rows.map((row) => gameSchema.parse(row.game_data));
  }

  async getSessionById(sessionId: string): Promise<Game | null> {
    const result = await this.pool.query<SessionRow>(
      `
        select game_data
        from game_sessions
        where id = $1
      `,
      [sessionId]
    );

    const row = result.rows[0];
    return row ? gameSchema.parse(row.game_data) : null;
  }

  async saveSession(session: Game): Promise<void> {
    const canonicalSession = gameSchema.parse(session);

    await this.pool.query(
      `
        insert into game_sessions (
          id,
          scenario_id,
          status,
          mode,
          current_faction_id,
          turn_number,
          target_game_length,
          game_data,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::timestamptz, $10::timestamptz)
        on conflict (id) do update
        set
          scenario_id = excluded.scenario_id,
          status = excluded.status,
          mode = excluded.mode,
          current_faction_id = excluded.current_faction_id,
          turn_number = excluded.turn_number,
          target_game_length = excluded.target_game_length,
          game_data = excluded.game_data,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at
      `,
      [
        canonicalSession.id,
        canonicalSession.scenarioId,
        canonicalSession.status,
        canonicalSession.mode,
        canonicalSession.currentFactionId,
        canonicalSession.turnNumber,
        canonicalSession.sessionConfig.targetGameLength,
        JSON.stringify(canonicalSession),
        canonicalSession.createdAt,
        canonicalSession.updatedAt
      ]
    );
  }
}
