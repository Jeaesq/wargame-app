"use server";

import { redirect } from "next/navigation";
import { createGame } from "../../../lib/api";

export type FormActionState = {
  error?: string;
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

    if (!playerName) {
      return {
        error: "Player name is required."
      };
    }

    const game = await createGame({
      scenarioId,
      mode: mode === "head_to_head" ? "head_to_head" : "solo",
      players: [
        {
          name: playerName,
          role: "human",
          factionId
        }
      ]
    });

    redirect(`/games/${game.id}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create game."
    };
  }
}
