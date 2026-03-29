"use server";

import { submitTurn } from "../../../../lib/api";

export type TurnFormActionState = {
  error?: string;
  redirectTo?: string;
};

export async function submitTurnAction(
  _previousState: TurnFormActionState,
  formData: FormData
): Promise<TurnFormActionState> {
  try {
    const gameId = String(formData.get("gameId") ?? "");
    const playerId = String(formData.get("playerId") ?? "");
    const factionId = String(formData.get("factionId") ?? "");
    const optionId = String(formData.get("optionId") ?? "");

    await submitTurn(gameId, {
      playerId,
      factionId,
      optionId,
      parameters: {},
      clientContext: {
        source: "web-turn-form"
      }
    });

    return {
      redirectTo: `/games/${gameId}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to submit turn."
    };
  }
}
