import type { BotDecisionProvider, BotDecisionProviderInput } from "../types.js";
import { ProviderInvocationError } from "../../errors/app-error.js";
import { logError, logInfo } from "../../logger.js";
import { botDecisionPayloadJsonSchema } from "./json-schemas.js";
import { mapOpenAIBotDecisionOutput } from "./mappers.js";
import { buildOpenAIBotDecisionPrompt } from "./prompts.js";
import { OpenAIResponsesClient } from "./response-client.js";

// Skeleton only: this is an optional future bot-decision seam.
// It is intentionally conservative and not yet production-complete.
export class OpenAIBotDecisionProvider implements BotDecisionProvider {
  constructor(private readonly client: OpenAIResponsesClient) {}

  async chooseBotDecision(input: BotDecisionProviderInput): Promise<unknown> {
    logInfo("Bot provider path selected.", {
      provider: "openai",
      gameId: input.game.id,
      turnNumber: input.game.turnNumber,
      factionId: input.factionId
    });

    try {
      const prompt = buildOpenAIBotDecisionPrompt(input);
      const rawOutput = await this.client.requestStructuredOutput({
        instructions: prompt.instructions,
        prompt: prompt.prompt,
        schemaName: "bot_decision_payload",
        schema: botDecisionPayloadJsonSchema
      });

      return mapOpenAIBotDecisionOutput(rawOutput);
    } catch (error) {
      logError("OpenAI bot decision provider failed.", {
        gameId: input.game.id,
        turnNumber: input.game.turnNumber,
        factionId: input.factionId,
        reason: error instanceof Error ? error.message : "unknown",
        details:
          error instanceof ProviderInvocationError ? error.details : undefined
      });
      throw error;
    }
  }
}
