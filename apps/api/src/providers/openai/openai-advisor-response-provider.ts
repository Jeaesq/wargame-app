import { advisorResponsePayloadSchema } from "@wargame/shared";
import { logInfo, logWarn, logError } from "../../logger.js";
import { MockAdvisorResponseProvider } from "../mock/mock-advisor-response-provider.js";
import type {
  AdvisorResponseProvider,
  AdvisorResponseProviderInput
} from "../types.js";
import {
  classifyProviderFailure,
  summarizeProviderFailure
} from "../provider-observability.js";
import { advisorResponsePayloadJsonSchema } from "./json-schemas.js";
import { mapOpenAIAdvisorResponseOutput } from "./mappers.js";
import { buildOpenAIAdvisorPrompt } from "./prompts.js";
import { OpenAIResponsesClient } from "./response-client.js";

type StructuredOutputClient = Pick<OpenAIResponsesClient, "requestStructuredOutput">;

export class OpenAIAdvisorResponseProvider implements AdvisorResponseProvider {
  constructor(
    private readonly client: StructuredOutputClient,
    private readonly fallbackProvider: AdvisorResponseProvider = new MockAdvisorResponseProvider()
  ) {}

  async generateAdvisorResponse(
    input: AdvisorResponseProviderInput
  ): Promise<unknown> {
    logInfo("Advisor provider path selected.", {
      provider: "openai",
      gameId: input.context.gameId,
      turnNumber: input.context.turnNumber
    });

    try {
      const prompt = buildOpenAIAdvisorPrompt(input);
      const rawOutput = await this.client.requestStructuredOutput({
        instructions: prompt.instructions,
        prompt: prompt.prompt,
        schemaName: "advisor_response_payload",
        schema: advisorResponsePayloadJsonSchema
      });

      const payload = advisorResponsePayloadSchema.parse({
        ...mapOpenAIAdvisorResponseOutput(rawOutput),
        metadata: {
          provider: "openai-advisor-response"
        }
      });

      logInfo("Advisor provider result resolved.", {
        providerPath: "openai",
        resultProvider: String(payload.metadata.provider ?? "unknown"),
        usedFallback: false,
        gameId: input.context.gameId,
        turnNumber: input.context.turnNumber
      });

      return payload;
    } catch (error) {
      const failure = classifyProviderFailure(error);

      logWarn("Advisor provider falling back to mock.", {
        gameId: input.context.gameId,
        turnNumber: input.context.turnNumber,
        providerPath: "openai",
        fallbackProvider: "mock",
        ...summarizeProviderFailure(error)
      });
      return this.generateFallbackResponse(input, error);
    }
  }

  private async generateFallbackResponse(
    input: AdvisorResponseProviderInput,
    error: unknown
  ): Promise<unknown> {
    try {
      const fallbackResponse = await this.fallbackProvider.generateAdvisorResponse(input);
      const fallbackPayload = advisorResponsePayloadSchema.parse(fallbackResponse);
      const failure = classifyProviderFailure(error);
      const fallbackReason =
        failure.category === "response_validation"
          ? "invalid_provider_output"
          : "provider_invocation_error";
      const fallbackMessage =
        error instanceof Error ? error.message : "Unknown advisor provider failure.";

      const payload = advisorResponsePayloadSchema.parse({
        ...fallbackPayload,
        metadata: {
          ...fallbackPayload.metadata,
          provider: "openai-advisor-response-fallback",
          fallbackProvider: "mock-advisor-response",
          fallbackReason,
          fallbackMessage
        }
      });

      logInfo("Advisor provider result resolved.", {
        providerPath: "openai",
        resultProvider: String(payload.metadata.provider ?? "unknown"),
        usedFallback: true,
        fallbackProvider: String(payload.metadata.fallbackProvider ?? "mock"),
        gameId: input.context.gameId,
        turnNumber: input.context.turnNumber
      });

      return payload;
    } catch (fallbackError) {
      logError("Advisor fallback provider failed.", {
        gameId: input.context.gameId,
        turnNumber: input.context.turnNumber,
        providerPath: "openai",
        fallbackProvider: "mock",
        upstreamFailure: summarizeProviderFailure(error),
        fallbackFailure: summarizeProviderFailure(fallbackError)
      });
      throw fallbackError;
    }
  }
}
