import { advisorResponsePayloadSchema } from "@wargame/shared";
import { logInfo } from "../../logger.js";
import { getStrategicCategory } from "../../services/faction-strategy-context.js";
import type {
  AdvisorResponseProvider,
  AdvisorResponseProviderInput
} from "../types.js";

function getStrategicBonus(input: {
  option: AdvisorResponseProviderInput["context"]["visibleOptions"][number];
  assessment: AdvisorResponseProviderInput["context"]["strategicAssessment"];
}) {
  if (!input.assessment) {
    return 0;
  }

  const category = getStrategicCategory(input.option);
  let bonus = 0;

  if (input.assessment.preferredCategories.includes(category)) {
    bonus += 4;
  }

  if (
    input.assessment.cautiousCategories.includes(category) &&
    input.assessment.escalationRiskPercent >= 65
  ) {
    bonus -= 5;
  }

  if (
    input.assessment.escalationRiskPercent >= 75 &&
    input.option.effectProfile.worldTensionDelta <= 0
  ) {
    bonus += 6;
  }

  return bonus;
}

export class MockAdvisorResponseProvider implements AdvisorResponseProvider {
  async generateAdvisorResponse(
    input: AdvisorResponseProviderInput
  ): Promise<unknown> {
    logInfo("Advisor provider path selected.", {
      provider: "mock",
      gameId: input.context.gameId,
      turnNumber: input.context.turnNumber
    });

    const normalizedQuestion = input.question.trim().toLowerCase();
    const rankedOptions = [...input.context.visibleOptions].sort((left, right) => {
      const leftScore =
        (left.recommendationPercent ?? 0) +
        getStrategicBonus({
          option: left,
          assessment: input.context.strategicAssessment
        });
      const rightScore =
        (right.recommendationPercent ?? 0) +
        getStrategicBonus({
          option: right,
          assessment: input.context.strategicAssessment
        });

      return rightScore - leftScore;
    });
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
    const asksWhatMatters =
      normalizedQuestion.includes("matter") ||
      normalizedQuestion.includes("priority") ||
      normalizedQuestion.includes("focus");
    const visibleOutcome = input.context.visibleOutcome;
    const strategicAssessment = input.context.strategicAssessment;
    const doctrineLine = strategicAssessment
      ? `Visible doctrine points toward ${strategicAssessment.doctrineLabel}.`
      : "No doctrine-specific visible framing is available.";
    const opponentLine = input.context.likelyOpponentAssessment
      ? `The likely opposing posture points toward ${input.context.likelyOpponentAssessment.doctrineLabel}${input.context.likelyOpponentFactionId ? ` for ${input.context.likelyOpponentFactionId}` : ""}.`
      : "No opponent posture can be inferred from the current visible state.";
    const privateLine = input.context.privateBriefing
      ? `Current private briefing: ${input.context.privateBriefing}`
      : "No additional private briefing is available in this view.";

    let shortAnswer = "The visible situation remains manageable but tense.";
    let rationale = [
      `Public world tension is currently ${publicState.worldTension}%.`,
      `There are ${input.context.visibleOptions.length} visible option(s) available from this perspective.`,
      doctrineLine
    ];
    let confidenceLabel: "low" | "medium" | "high" | "uncertain" = "medium";
    let summary =
      "Visible state suggests caution: the crisis is active, but there is still room to shape the next move.";
    const pacingAssumption =
      input.targetGameLength === "short"
        ? "Session pacing target is short, so visible recommendations should favor decisive progress without assuming automatic ending conditions."
        : input.targetGameLength === "long"
          ? "Session pacing target is long, so visible recommendations should preserve flexibility for a slower-burn crisis."
          : "Session pacing target is medium, so visible recommendations should balance progress with restraint.";

    if (asksAboutRisk) {
      shortAnswer =
        publicState.worldTension >= 60
          ? "Visible escalation risk is elevated."
          : "Visible escalation risk is present but not yet extreme.";
      summary = shortAnswer;
      rationale = [
        `World tension is ${publicState.worldTension}% based on public state.`,
        doctrineLine,
        opponentLine,
        "Recent public conditions indicate the next move will be interpreted as a signal of intent.",
        "This answer excludes hidden intelligence and uses only player-visible information."
      ];

      if (input.context.visibleWarnings.length > 0) {
        rationale.push(`Visible warning: ${input.context.visibleWarnings[0]}`);
      }

      confidenceLabel = publicState.worldTension >= 60 ? "high" : "medium";
    } else if (asksWhatMatters) {
      shortAnswer =
        visibleOutcome.pressure.deescalationOpportunityPercent >= 60
          ? "What matters most now is whether you convert the visible off-ramp into controlled de-escalation."
          : visibleOutcome.pressure.catastrophicRiskPercent >= 70
            ? "What matters most now is avoiding a visible step that tips the crisis into catastrophic escalation."
            : "What matters most now is changing leverage without losing control of escalation.";
      summary = shortAnswer;
      rationale = [
        `Visible scenario maturity is ${visibleOutcome.pressure.maturityPercent}%.`,
        `Visible catastrophic risk is ${visibleOutcome.pressure.catastrophicRiskPercent}% and de-escalation opportunity is ${visibleOutcome.pressure.deescalationOpportunityPercent}%.`,
        strategicAssessment?.visiblePriority ?? doctrineLine,
        opponentLine,
        "The visible question is less about hidden intent and more about whether the next move creates leverage or opens an off-ramp."
      ];
      confidenceLabel = "medium";
    } else if (asksAboutOptions && topOption) {
      shortAnswer = `The strongest visible option is ${topOption.title.toLowerCase()}.`;
      summary = `Based on visible state, ${topOption.title.toLowerCase()} is the clearest recommendation.`;
      rationale = [
        `${topOption.title} carries the highest visible advisory score at ${topOption.recommendationPercent ?? 0}%.`,
        strategicAssessment?.visiblePriority ?? doctrineLine,
        opponentLine,
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
        privateLine,
        opponentLine,
        `World tension is ${publicState.worldTension}% in the public state.`,
        "This answer is grounded only in public information and visible options."
      ];
      confidenceLabel = "medium";
    } else if (topOption) {
      shortAnswer = `A cautious recommendation is to consider ${topOption.title.toLowerCase()}.`;
      summary = shortAnswer;
      rationale = [
        `${topOption.title} is currently the highest-ranked visible option.`,
        strategicAssessment?.visiblePriority ?? doctrineLine,
        opponentLine,
        `Visible tension is ${publicState.worldTension}%.`,
        "No hidden state was used to produce this answer."
      ];
    }

    const payload = advisorResponsePayloadSchema.parse({
      summary,
      shortAnswer,
      rationale:
        topOption || asksAboutRisk || asksAboutTension || asksWhatMatters
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
        "This mock advisor answers from player-visible public and faction-visible private state only."
      ],
      assumptions: [
        `Scenario context: ${input.scenario.title}`,
        pacingAssumption,
        doctrineLine,
        opponentLine,
        "No hidden intelligence or external LLM call has been used in this placeholder implementation."
      ],
      metadata: {
        provider: "mock-advisor-response"
      }
    });

    logInfo("Advisor provider result resolved.", {
      providerPath: "mock",
      resultProvider: String(payload.metadata.provider ?? "unknown"),
      usedFallback: false,
      gameId: input.context.gameId,
      turnNumber: input.context.turnNumber
    });

    return payload;
  }
}
