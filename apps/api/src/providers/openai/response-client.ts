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
        failureStage: "api_request",
        cause: error instanceof Error ? error.message : "unknown",
        schemaName: input.schemaName,
        provider: "openai",
        operation: "responses.create"
      });
    }

    if (!response.ok) {
      const apiError = await extractOpenAIErrorDetails(response);
      throw new ProviderInvocationError("OpenAI Responses API request failed.", {
        failureStage: "api_request",
        status: response.status,
        statusText: response.statusText,
        schemaName: input.schemaName,
        provider: "openai",
        operation: "responses.create",
        requestId: response.headers.get("x-request-id") ?? undefined,
        ...apiError
      });
    }

    const payload = await response.json();
    const structuredOutput = extractStructuredOutput(payload);

    if (structuredOutput === null) {
      throw new ProviderInvocationError(
        "OpenAI Responses API returned no structured output.",
        {
          failureStage: "response_validation",
          schemaName: input.schemaName,
          provider: "openai",
          operation: "responses.create"
        }
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
        failureStage: "response_validation",
        cause: error instanceof Error ? error.message : "unknown"
      }
    );
  }
}

async function extractOpenAIErrorDetails(response: Response) {
  const bodyText = await response.text();

  try {
    const payload = JSON.parse(bodyText) as {
      error?: {
        message?: unknown;
        type?: unknown;
        code?: unknown;
        param?: unknown;
      };
    };

    if (payload.error && typeof payload.error === "object") {
      return {
        providerErrorMessage:
          typeof payload.error.message === "string"
            ? payload.error.message
            : undefined,
        providerErrorType:
          typeof payload.error.type === "string" ? payload.error.type : undefined,
        providerErrorCode:
          typeof payload.error.code === "string" ? payload.error.code : undefined,
        providerErrorParam:
          typeof payload.error.param === "string" ? payload.error.param : undefined
      };
    }
  } catch {
    return {
      responseBodyExcerpt: bodyText.slice(0, 500)
    };
  }

  return {
    responseBodyExcerpt: bodyText.slice(0, 500)
  };
}
