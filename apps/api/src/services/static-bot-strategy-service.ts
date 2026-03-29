import type { BotMoveDecision, BotMoveInput, BotStrategyService } from "./types.js";

export class StaticBotStrategyService implements BotStrategyService {
  async chooseAction(input: BotMoveInput): Promise<BotMoveDecision | null> {
    const privateState = input.game.state.privateByPlayer.find(
      (state) => state.factionId === input.factionId
    );
    const options = privateState?.availableOptions ?? [];

    if (options.length === 0) {
      return null;
    }

    const rankedOptions = [...options].sort((left, right) => {
      const recommendationDelta =
        (right.recommendationPercent ?? 0) - (left.recommendationPercent ?? 0);

      if (recommendationDelta !== 0) {
        return recommendationDelta;
      }

      return left.id.localeCompare(right.id);
    });

    const selectedOption = rankedOptions[0];

    return {
      optionId: selectedOption.id,
      rationale:
        "Static bot selected the highest-ranked currently available option using backend-controlled ordering."
    };
  }
}
