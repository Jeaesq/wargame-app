import type {
  AdvisorResponseProvider,
  AdvisorResponseProviderInput
} from "../types.js";
import { advisorResponsePayloadJsonSchema } from "./json-schemas.js";
import { mapOpenAIAdvisorResponseOutput } from "./mappers.js";
import { buildOpenAIAdvisorPrompt } from "./prompts.js";
import { OpenAIResponsesClient } from "./response-client.js";

// Skeleton only: this is the future real-provider seam for Responses API integration.
// It is intentionally not production-complete and is not the default runtime path.
export class OpenAIAdvisorResponseProvider implements AdvisorResponseProvider {
  constructor(private readonly client: OpenAIResponsesClient) {}

  async generateAdvisorResponse(
    input: AdvisorResponseProviderInput
  ): Promise<unknown> {
    const prompt = buildOpenAIAdvisorPrompt(input);
    const rawOutput = await this.client.requestStructuredOutput({
      instructions: prompt.instructions,
      prompt: prompt.prompt,
      schemaName: "advisor_response_payload",
      schema: advisorResponsePayloadJsonSchema
    });

    return mapOpenAIAdvisorResponseOutput(rawOutput);
  }
}
