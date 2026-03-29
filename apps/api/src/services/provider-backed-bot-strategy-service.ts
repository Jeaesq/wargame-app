import { botDecisionPayloadSchema } from "@wargame/shared";
import { ValidationError } from "../errors/app-error.js";
import type { BotDecisionProvider } from "../providers/types.js";
import type {
  BotMoveDecision,
  BotMoveInput,
  BotStrategyService
} from "./types.js";

export class ProviderBackedBotStrategyService implements BotStrategyService {
  constructor(private readonly provider: BotDecisionProvider) {}

  async chooseAction(input: BotMoveInput): Promise<BotMoveDecision | null> {
    const privateState = input.game.state.privateByPlayer.find(
      (state) => state.factionId === input.factionId
    );
    const visibleOptions = privateState?.availableOptions ?? [];

    if (visibleOptions.length === 0) {
      return null;
    }

    const rawDecision = await this.provider.chooseBotDecision({
      game: input.game,
      scenario: input.scenario,
      factionId: input.factionId,
      visibleOptions,
      publicState: input.game.state.public
    });

    if (rawDecision === null) {
      return null;
    }

    const decision = botDecisionPayloadSchema.parse(rawDecision);
    const optionIsVisible = visibleOptions.some(
      (candidate) => candidate.id === decision.optionId
    );

    if (!optionIsVisible) {
      throw new ValidationError(
        `Bot provider selected invalid option ${decision.optionId}.`
      );
    }

    return {
      optionId: decision.optionId,
      rationale: decision.rationale
    };
  }
}
