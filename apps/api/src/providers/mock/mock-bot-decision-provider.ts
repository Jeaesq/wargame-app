import { botDecisionPayloadSchema } from "@wargame/shared";
import type { BotDecisionProvider, BotDecisionProviderInput } from "../types.js";

export class MockBotDecisionProvider implements BotDecisionProvider {
  async chooseBotDecision(input: BotDecisionProviderInput): Promise<unknown> {
    if (input.visibleOptions.length === 0) {
      return null;
    }

    const rankedOptions = [...input.visibleOptions].sort((left, right) => {
      const recommendationDelta =
        (right.recommendationPercent ?? 0) - (left.recommendationPercent ?? 0);

      if (recommendationDelta !== 0) {
        return recommendationDelta;
      }

      return left.id.localeCompare(right.id);
    });

    const selectedOption = rankedOptions[0];

    return botDecisionPayloadSchema.parse({
      optionId: selectedOption.id,
      rationale:
        "Mock bot selected the highest-ranked currently available option using backend-controlled ordering.",
      metadata: {
        provider: "mock-bot-decision"
      }
    });
  }
}
