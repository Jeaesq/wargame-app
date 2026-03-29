import {
  turnResolutionSchema,
  type TurnResolution
} from "@wargame/shared";
import type { Pool } from "pg";
import type { TurnRepository } from "../contracts.js";

type TurnRow = {
  turn_data: unknown;
};

export class PostgresTurnRepository implements TurnRepository {
  constructor(private readonly pool: Pool) {}

  async listTurnsBySessionId(sessionId: string): Promise<TurnResolution[]> {
    const result = await this.pool.query<TurnRow>(
      `
        select turn_data
        from game_turns
        where session_id = $1
        order by sequence_id asc
      `,
      [sessionId]
    );

    return result.rows.map((row) => turnResolutionSchema.parse(row.turn_data));
  }

  async appendTurn(sessionId: string, turn: TurnResolution): Promise<void> {
    const canonicalTurn = turnResolutionSchema.parse(turn);

    await this.pool.query(
      `
        insert into game_turns (
          id,
          session_id,
          turn_number,
          actor_player_id,
          actor_faction_id,
          resolved_at,
          turn_data
        )
        values ($1, $2, $3, $4, $5, $6::timestamptz, $7::jsonb)
        on conflict (id) do nothing
      `,
      [
        canonicalTurn.id,
        sessionId,
        canonicalTurn.turnNumber,
        canonicalTurn.actor.playerId,
        canonicalTurn.actor.factionId,
        canonicalTurn.resolvedAt,
        JSON.stringify(canonicalTurn)
      ]
    );
  }
}
