"use server";

import { createGame } from "../../../lib/api";

export type FormActionState = {
  error?: string;
  redirectTo?: string;
};

export async function createGameAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    const playerName = String(formData.get("playerName") ?? "").trim();
    const scenarioId = String(formData.get("scenarioId") ?? "");
    const mode = String(formData.get("mode") ?? "solo");
    const factionId = String(formData.get("factionId") ?? "");
    const targetGameLength = String(formData.get("targetGameLength") ?? "medium");

    if (!playerName) {
      return {
        error: "Player name is required."
      };
    }

    const game = await createGame({
      scenarioId,
      mode: mode === "head_to_head" ? "head_to_head" : "solo",
      targetGameLength:
        targetGameLength === "short" || targetGameLength === "long"
          ? targetGameLength
          : "medium",
      players: [
        {
          name: playerName,
          role: "human",
          factionId
        }
      ]
    });

    return {
      redirectTo: `/games/${game.id}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create game."
    };
  }
}
