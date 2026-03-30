import { ProviderInvocationError } from "../../errors/app-error.js";

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

function assertStructuredOutputSchemaIsCompatible(
  schema: Record<string, unknown>,
  schemaName: string
) {
  const issues: string[] = [];
  visitSchemaNode(schema, [], issues);

  if (issues.length > 0) {
    throw new ProviderInvocationError(
      "Structured output schema is incompatible with OpenAI Responses API.",
      {
        schemaName,
        issues
      }
    );
  }
}

function visitSchemaNode(
  node: unknown,
  path: Array<string | number>,
  issues: string[]
) {
  if (!node || typeof node !== "object") {
    return;
  }

  const candidate = node as {
    type?: unknown;
    properties?: unknown;
    items?: unknown;
    anyOf?: unknown;
    oneOf?: unknown;
    allOf?: unknown;
    additionalProperties?: unknown;
  };

  const nodeType = candidate.type;

  if (nodeType === "object") {
    if (candidate.additionalProperties !== false) {
      issues.push(
        `${formatSchemaPath(path)} must set additionalProperties: false`
      );
    }

    if (
      candidate.properties &&
      typeof candidate.properties === "object" &&
      candidate.properties !== null
    ) {
      for (const [key, value] of Object.entries(
        candidate.properties as Record<string, unknown>
      )) {
        visitSchemaNode(value, [...path, "properties", key], issues);
      }
    }
  }

  if (candidate.items) {
    visitSchemaNode(candidate.items, [...path, "items"], issues);
  }

  for (const keyword of ["anyOf", "oneOf", "allOf"] as const) {
    const value = candidate[keyword];

    if (Array.isArray(value)) {
      value.forEach((child, index) => {
        visitSchemaNode(child, [...path, keyword, index], issues);
      });
    }
  }
}

function formatSchemaPath(path: Array<string | number>) {
  if (path.length === 0) {
    return "schema";
  }

  return path
    .map((segment) =>
      typeof segment === "number" ? `[${segment}]` : segment
    )
    .join(".");
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
