import { advisorResponsePayloadSchema } from "@wargame/shared";
import type {
  AdvisorResponseProvider,
  AdvisorResponseProviderInput
} from "../types.js";

export class MockAdvisorResponseProvider implements AdvisorResponseProvider {
  async generateAdvisorResponse(
    input: AdvisorResponseProviderInput
  ): Promise<unknown> {
    const normalizedQuestion = input.question.trim().toLowerCase();
    const rankedOptions = [...input.context.visibleOptions].sort(
      (left, right) =>
        (right.recommendationPercent ?? 0) - (left.recommendationPercent ?? 0)
    );
    const topOption = rankedOptions[0];
    const publicState = input.context.publicState;
    const asksAboutRisk =
      normalizedQuestion.includes("risk") ||
      normalizedQuestion.includes("danger") ||
      normalizedQuestion.includes("escalat");
    const asksAboutOptions =
      normalizedQuestion.includes("option") ||
      normalizedQuestion.includes("move") ||
      normalizedQuestion.includes("should");
    const asksAboutTension =
      normalizedQuestion.includes("tension") ||
      normalizedQuestion.includes("situation") ||
      normalizedQuestion.includes("state");

    let shortAnswer = "The visible situation remains manageable but tense.";
    let rationale = [
      `Public world tension is currently ${publicState.worldTension}%.`,
      `There are ${input.context.visibleOptions.length} visible option(s) available from this perspective.`
    ];
    let confidenceLabel: "low" | "medium" | "high" | "uncertain" = "medium";
    let summary =
      "Visible state suggests caution: the crisis is active, but there is still room to shape the next move.";

    if (asksAboutRisk) {
      shortAnswer =
        publicState.worldTension >= 60
          ? "Visible escalation risk is elevated."
          : "Visible escalation risk is present but not yet extreme.";
      summary = shortAnswer;
      rationale = [
        `World tension is ${publicState.worldTension}% based on public state.`,
        "Recent public conditions indicate the next move will be interpreted as a signal of intent.",
        "This answer excludes hidden intelligence and uses only player-visible information."
      ];

      if (input.context.visibleWarnings.length > 0) {
        rationale.push(`Visible warning: ${input.context.visibleWarnings[0]}`);
      }

      confidenceLabel = publicState.worldTension >= 60 ? "high" : "medium";
    } else if (asksAboutOptions && topOption) {
      shortAnswer = `The strongest visible option is ${topOption.title.toLowerCase()}.`;
      summary = `Based on visible state, ${topOption.title.toLowerCase()} is the clearest recommendation.`;
      rationale = [
        `${topOption.title} carries the highest visible advisory score at ${topOption.recommendationPercent ?? 0}%.`,
        `Public tension is ${publicState.worldTension}%, so visible signaling still matters.`,
        "This answer is limited to currently visible options and public state."
      ];
      confidenceLabel =
        (topOption.recommendationPercent ?? 0) >= 65 ? "high" : "medium";
    } else if (asksAboutTension) {
      shortAnswer = `The public situation is defined by ${publicState.headline?.toLowerCase() ?? "an active crisis"}.`;
      summary =
        "The crisis remains unresolved, and the visible state suggests that pressure and signaling are the main drivers right now.";
      rationale = [
        publicState.publicNarrative,
        `World tension is ${publicState.worldTension}% in the public state.`,
        "This answer is grounded only in public information and visible options."
      ];
      confidenceLabel = "medium";
    } else if (topOption) {
      shortAnswer = `A cautious recommendation is to consider ${topOption.title.toLowerCase()}.`;
      summary = shortAnswer;
      rationale = [
        `${topOption.title} is currently the highest-ranked visible option.`,
        `Visible tension is ${publicState.worldTension}%.`,
        "No hidden state was used to produce this answer."
      ];
    }

    return advisorResponsePayloadSchema.parse({
      summary,
      shortAnswer,
      rationale:
        topOption || asksAboutRisk || asksAboutTension
          ? rationale
          : [
              "No visible option or public-state signal was strong enough to support a clearer answer."
            ],
      recommendationBand:
        topOption && asksAboutOptions ? "medium" : asksAboutRisk ? "uncertain" : "medium",
      confidenceLabel,
      recommendedOptionIds: topOption ? [topOption.id] : [],
      confidencePercent: topOption?.recommendationPercent ?? 25,
      riskNotes: [
        "Recommendation percentages are advisory and not deterministic.",
        "This mock advisor answers from visible public state and visible options only."
      ],
      assumptions: [
        `Scenario context: ${input.scenario.title}`,
        "No hidden intelligence or external LLM call has been used in this placeholder implementation."
      ],
      metadata: {
        provider: "mock-advisor-response"
      }
    });
  }
}
