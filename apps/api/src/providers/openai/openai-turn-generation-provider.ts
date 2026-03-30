import type { TurnGenerationProvider, TurnGenerationProviderInput } from "../types.js";
import { ProviderInvocationError } from "../../errors/app-error.js";
import { logError, logInfo } from "../../logger.js";
import { MockTurnGenerationProvider } from "../mock/mock-turn-generation-provider.js";
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

      return mapOpenAITurnGenerationOutput(rawOutput);
    } catch (error) {
      logError("OpenAI turn generation provider failed.", {
        gameId: input.game.id,
        turnNumber: input.game.turnNumber,
        actionId: input.action.id,
        reason: error instanceof Error ? error.message : "unknown",
        details:
          error instanceof ProviderInvocationError ? error.details : undefined
      });

      return this.fallbackProvider.generateTurnArtifacts(input);
    }
  }
}
