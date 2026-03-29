import { advisorAnswerSchema } from "@wargame/shared";
import { randomUUID } from "node:crypto";
import type { AdvisorService, GenerateAdvisorAnswerInput } from "./types.js";

export class StaticAdvisorService implements AdvisorService {
  constructor(private readonly now: () => string) {}

  async generateAdvisorAnswer(input: GenerateAdvisorAnswerInput) {
    const visibleOptions = input.factionId
      ? (
          input.game.state.privateByPlayer.find(
            (state) => state.factionId === input.factionId
          )?.availableOptions ?? []
        )
      : [];

    const rankedOptions = [...visibleOptions].sort(
      (left, right) =>
        (right.recommendationPercent ?? 0) - (left.recommendationPercent ?? 0)
    );

    const topOption = rankedOptions[0];

    return advisorAnswerSchema.parse({
      answerId: randomUUID(),
      gameId: input.game.id,
      turnNumber: input.game.turnNumber,
      perspectiveFactionId: input.factionId,
      summary: topOption
        ? `Priority should stay on ${topOption.title.toLowerCase()}.`
        : "No clear advisory option is available for the current faction.",
      rationale: topOption
        ? [
            "Current visible options favor low-complexity guidance over aggressive branching.",
            "The advisor is using placeholder heuristics until the richer simulation model is implemented."
          ]
        : ["No legal options were found for the requested perspective."],
      recommendationBand: topOption ? "medium" : "uncertain",
      recommendedOptionIds: topOption ? [topOption.id] : [],
      confidencePercent: topOption?.recommendationPercent ?? 25,
      riskNotes: [
        "Recommendation percentages are advisory and not deterministic.",
        "This service is intentionally lightweight and can later be upgraded with richer analysis."
      ],
      assumptions: [
        `Scenario context: ${input.scenario.title}`,
        "No external LLM call has been made in this placeholder implementation."
      ],
      metadata: {
        provider: "static-advisor",
        generatedAt: this.now()
      }
    });
  }
}
