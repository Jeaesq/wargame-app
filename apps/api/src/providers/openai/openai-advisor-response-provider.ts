import { advisorResponsePayloadSchema } from "@wargame/shared";
import { ProviderInvocationError } from "../../errors/app-error.js";
import { logError, logInfo } from "../../logger.js";
import { MockAdvisorResponseProvider } from "../mock/mock-advisor-response-provider.js";
import type {
  AdvisorResponseProvider,
  AdvisorResponseProviderInput
} from "../types.js";
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

      return advisorResponsePayloadSchema.parse({
        ...mapOpenAIAdvisorResponseOutput(rawOutput),
        metadata: {
          provider: "openai-advisor-response"
        }
      });
    } catch (error) {
      logError("OpenAI advisor provider failed; falling back to mock advisor.", {
        gameId: input.context.gameId,
        turnNumber: input.context.turnNumber,
        question: input.question,
        reason: error instanceof Error ? error.message : "unknown",
        details:
          error instanceof ProviderInvocationError ? error.details : undefined
      });
      return this.generateFallbackResponse(input, error);
    }
  }

  private async generateFallbackResponse(
    input: AdvisorResponseProviderInput,
    error: unknown
  ): Promise<unknown> {
    const fallbackResponse = await this.fallbackProvider.generateAdvisorResponse(input);
    const fallbackPayload = advisorResponsePayloadSchema.parse(fallbackResponse);
    const fallbackReason =
      error instanceof ProviderInvocationError ? "provider_invocation_error" : "invalid_provider_output";
    const fallbackMessage =
      error instanceof Error ? error.message : "Unknown advisor provider failure.";

    return advisorResponsePayloadSchema.parse({
      ...fallbackPayload,
      metadata: {
        ...fallbackPayload.metadata,
        provider: "openai-advisor-response-fallback",
        fallbackProvider: "mock-advisor-response",
        fallbackReason,
        fallbackMessage
      }
    });
  }
}
