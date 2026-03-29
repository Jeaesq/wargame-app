import type { TurnGenerationProvider, TurnGenerationProviderInput } from "../types.js";
import { turnGenerationArtifactsJsonSchema } from "./json-schemas.js";
import { mapOpenAITurnGenerationOutput } from "./mappers.js";
import { buildOpenAITurnGenerationPrompt } from "./prompts.js";
import { OpenAIResponsesClient } from "./response-client.js";

// Skeleton only: this is the future real-provider seam for Responses API integration.
// It is intentionally not production-complete and is not the default runtime path.
export class OpenAITurnGenerationProvider implements TurnGenerationProvider {
  constructor(private readonly client: OpenAIResponsesClient) {}

  async generateTurnArtifacts(input: TurnGenerationProviderInput): Promise<unknown> {
    const prompt = buildOpenAITurnGenerationPrompt(input);
    const rawOutput = await this.client.requestStructuredOutput({
      instructions: prompt.instructions,
      prompt: prompt.prompt,
      schemaName: "turn_generation_artifacts",
      schema: turnGenerationArtifactsJsonSchema
    });

    return mapOpenAITurnGenerationOutput(rawOutput);
  }
}
