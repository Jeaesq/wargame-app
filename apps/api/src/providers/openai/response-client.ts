import { ProviderInvocationError } from "../../errors/app-error.js";
import { assertStructuredOutputSchemaIsCompatible } from "./structured-output-schema.js";

type StructuredResponseRequest = {
  instructions: string;
  prompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
};

type OpenAIClientConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export class OpenAIResponsesClient {
  constructor(private readonly config: OpenAIClientConfig) {}

  async requestStructuredOutput(
    input: StructuredResponseRequest
  ): Promise<unknown> {
    assertStructuredOutputSchemaIsCompatible(input.schema, input.schemaName);

    let response: Response;

    try {
      response = await fetch(`${this.config.baseUrl}/responses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.config.model,
          input: [
            {
              role: "developer",
              content: [{ type: "input_text", text: input.instructions }]
            },
            {
              role: "user",
              content: [{ type: "input_text", text: input.prompt }]
            }
          ],
          text: {
            format: {
              type: "json_schema",
              name: input.schemaName,
              schema: input.schema,
              strict: true
            }
          }
        })
      });
    } catch (error) {
      throw new ProviderInvocationError("OpenAI Responses API request failed.", {
        cause: error instanceof Error ? error.message : "unknown",
        schemaName: input.schemaName
      });
    }

    if (!response.ok) {
      const bodyText = await response.text();
      throw new ProviderInvocationError("OpenAI Responses API request failed.", {
        status: response.status,
        statusText: response.statusText,
        body: bodyText.slice(0, 2000),
        schemaName: input.schemaName
      });
    }

    const payload = await response.json();
    const structuredOutput = extractStructuredOutput(payload);

    if (structuredOutput === null) {
      throw new ProviderInvocationError(
        "OpenAI Responses API returned no structured output."
      );
    }

    return structuredOutput;
  }
}
function extractStructuredOutput(payload: unknown): unknown | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (typeof candidate.output_text === "string") {
    return parseJsonText(candidate.output_text);
  }

  for (const item of candidate.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return parseJsonText(content.text);
      }
    }
  }

  return null;
}

function parseJsonText(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new ProviderInvocationError(
      "OpenAI Responses API returned text that was not valid JSON.",
      {
        cause: error instanceof Error ? error.message : "unknown"
      }
    );
  }
}
