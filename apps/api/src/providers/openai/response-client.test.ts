import assert from "node:assert/strict";
import test from "node:test";
import { ProviderInvocationError } from "../../errors/app-error.js";
import { OpenAIResponsesClient } from "./response-client.js";
import {
  createStrictEmptyObjectJsonSchema,
  createStrictObjectJsonSchema
} from "./structured-output-schema.js";

test("requestStructuredOutput rejects schemas with non-strict object nodes before calling OpenAI", async () => {
  const client = new OpenAIResponsesClient({
    apiKey: "test-key",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini"
  });

  await assert.rejects(
    () =>
      client.requestStructuredOutput({
        instructions: "Return JSON.",
        prompt: "Test prompt.",
        schemaName: "invalid_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["metadata"],
          properties: {
            metadata: {
              type: "object"
            }
          }
        }
      }),
    (error: unknown) => {
      assert.ok(error instanceof ProviderInvocationError);
      assert.equal(
        error.message,
        "Structured output schema is incompatible with OpenAI Responses API."
      );
      assert.deepEqual(error.details, {
        failureStage: "schema_construction",
        schemaName: "invalid_schema",
        issues: ["properties.metadata must set additionalProperties: false"]
      });
      return true;
    }
  );
});

test("strict object schema helper produces OpenAI-compatible object nodes", () => {
  const schema = createStrictObjectJsonSchema({
    required: ["metadata"],
    properties: {
      metadata: createStrictEmptyObjectJsonSchema()
    }
  });

  assert.deepEqual(schema, {
    type: "object",
    additionalProperties: false,
    required: ["metadata"],
    properties: {
      metadata: {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: []
      }
    }
  });
});
