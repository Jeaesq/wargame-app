import type { BotDecisionProvider, BotDecisionProviderInput } from "../types.js";
import { botDecisionPayloadJsonSchema } from "./json-schemas.js";
import { mapOpenAIBotDecisionOutput } from "./mappers.js";
import { buildOpenAIBotDecisionPrompt } from "./prompts.js";
import { OpenAIResponsesClient } from "./response-client.js";

// Skeleton only: this is an optional future bot-decision seam.
// It is intentionally conservative and not yet production-complete.
export class OpenAIBotDecisionProvider implements BotDecisionProvider {
  constructor(private readonly client: OpenAIResponsesClient) {}

  async chooseBotDecision(input: BotDecisionProviderInput): Promise<unknown> {
    const prompt = buildOpenAIBotDecisionPrompt(input);
    const rawOutput = await this.client.requestStructuredOutput({
      instructions: prompt.instructions,
      prompt: prompt.prompt,
      schemaName: "bot_decision_payload",
      schema: botDecisionPayloadJsonSchema
    });

    return mapOpenAIBotDecisionOutput(rawOutput);
  }
}
