"use server";

import { askAdvisor } from "../../../../lib/api";

export type AdvisorFormState = {
  error?: string;
  answerText?: string;
};

export async function askAdvisorAction(
  _previousState: AdvisorFormState,
  formData: FormData
): Promise<AdvisorFormState> {
  try {
    const gameId = String(formData.get("gameId") ?? "");
    const question = String(formData.get("question") ?? "").trim();
    const factionId = String(formData.get("factionId") ?? "") || null;
    const playerId = String(formData.get("playerId") ?? "") || undefined;

    if (!question) {
      return {
        error: "Enter a question for the advisor."
      };
    }

    const answer = await askAdvisor(gameId, {
      question,
      factionId,
      playerId
    });

    return {
      answerText: answer.shortAnswer
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to query the advisor."
    };
  }
}
