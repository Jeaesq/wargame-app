import { ProviderInvocationError } from "../../errors/app-error.js";

type JsonSchema = Record<string, unknown>;

export function createStrictObjectJsonSchema(input: {
  properties?: Record<string, JsonSchema>;
  required?: string[];
}) {
  return {
    type: "object",
    additionalProperties: false,
    properties: input.properties ?? {},
    required: input.required ?? []
  } as const;
}

export function createStrictEmptyObjectJsonSchema() {
  return createStrictObjectJsonSchema({});
}

export function assertStructuredOutputSchemaIsCompatible(
  schema: JsonSchema,
  schemaName: string
) {
  const issues: string[] = [];
  visitSchemaNode(schema, [], issues);

  if (issues.length > 0) {
    throw new ProviderInvocationError(
      "Structured output schema is incompatible with OpenAI Responses API.",
      {
        failureStage: "schema_construction",
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

  if (candidate.type === "object") {
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
