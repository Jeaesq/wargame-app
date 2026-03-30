import type { TurnGenerationProvider, TurnGenerationProviderInput } from "../types.js";
import { turnGenerationArtifactsSchema } from "@wargame/shared";
import { logError, logInfo, logWarn } from "../../logger.js";
import { MockTurnGenerationProvider } from "../mock/mock-turn-generation-provider.js";
import {
  classifyProviderFailure,
  summarizeProviderFailure
} from "../provider-observability.js";
import { turnGenerationArtifactsJsonSchema } from "./json-schemas.js";
import { mapOpenAITurnGenerationOutput } from "./mappers.js";
import { buildOpenAITurnGenerationPrompt } from "./prompts.js";
import { OpenAIResponsesClient } from "./response-client.js";

type StructuredOutputClient = Pick<OpenAIResponsesClient, "requestStructuredOutput">;

export class OpenAITurnGenerationProvider implements TurnGenerationProvider {
  constructor(
    private readonly client: StructuredOutputClient,
    private readonly fallbackProvider: TurnGenerationProvider = new MockTurnGenerationProvider()
  ) {}

  async generateTurnArtifacts(input: TurnGenerationProviderInput): Promise<unknown> {
    logInfo("Turn resolution provider path selected.", {
      provider: "openai",
      gameId: input.game.id,
      turnNumber: input.game.turnNumber,
      actionId: input.action.id
    });

    try {
      const prompt = buildOpenAITurnGenerationPrompt(input);
      const rawOutput = await this.client.requestStructuredOutput({
        instructions: prompt.instructions,
        prompt: prompt.prompt,
        schemaName: "turn_generation_artifacts",
        schema: turnGenerationArtifactsJsonSchema
      });

      const payload = mapOpenAITurnGenerationOutput(rawOutput);
      logInfo("Turn provider result resolved.", {
        providerPath: "openai",
        resultProvider: String(payload.metadata.provider ?? "openai-turn-generation"),
        usedFallback: false,
        gameId: input.game.id,
        turnNumber: input.game.turnNumber,
        actionId: input.action.id
      });

      return payload;
    } catch (error) {
      logWarn("Turn provider falling back to mock.", {
        gameId: input.game.id,
        turnNumber: input.game.turnNumber,
        actionId: input.action.id,
        providerPath: "openai",
        fallbackProvider: "mock",
        ...summarizeProviderFailure(error)
      });

      try {
        const fallbackResponse = await this.fallbackProvider.generateTurnArtifacts(input);
        const fallbackPayload = turnGenerationArtifactsSchema.parse(fallbackResponse);
        const failure = classifyProviderFailure(error);
        const payload = turnGenerationArtifactsSchema.parse({
          ...fallbackPayload,
          metadata: {
            ...fallbackPayload.metadata,
            provider: "openai-turn-generation-fallback",
            fallbackProvider: "mock-turn-generation",
            fallbackReason:
              failure.category === "response_validation"
                ? "invalid_provider_output"
                : "provider_invocation_error",
            fallbackMessage:
              error instanceof Error ? error.message : "Unknown turn provider failure."
          }
        });

        logInfo("Turn provider result resolved.", {
          providerPath: "openai",
          resultProvider: String(payload.metadata.provider ?? "unknown"),
          usedFallback: true,
          fallbackProvider: String(payload.metadata.fallbackProvider ?? "mock"),
          gameId: input.game.id,
          turnNumber: input.game.turnNumber,
          actionId: input.action.id
        });

        return payload;
      } catch (fallbackError) {
        logError("Turn fallback provider failed.", {
          gameId: input.game.id,
          turnNumber: input.game.turnNumber,
          actionId: input.action.id,
          providerPath: "openai",
          fallbackProvider: "mock",
          upstreamFailure: summarizeProviderFailure(error),
          fallbackFailure: summarizeProviderFailure(fallbackError)
        });
        throw fallbackError;
      }
    }
  }
}
