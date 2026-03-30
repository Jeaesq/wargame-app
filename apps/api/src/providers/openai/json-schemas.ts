import {
  createStrictEmptyObjectJsonSchema,
  createStrictObjectJsonSchema
} from "./structured-output-schema.js";

// These JSON Schemas are intentionally narrow and pragmatic.
// They are suitable for an initial Responses API integration seam
// and are constructed with strict object helpers so OpenAI Structured Outputs
// compatibility is explicit at every object node.

const strictEmptyObjectJsonSchema = createStrictEmptyObjectJsonSchema();

export const turnGenerationArtifactsJsonSchema = createStrictObjectJsonSchema({
  required: [
    "publicSummary",
    "privateSummaries",
    "effects",
    "recommendationLabels",
    "riskLabels",
    "recommendedNextOptionIds",
    "worldUpdateSuggestions",
    "llmNarrative",
    "metadata"
  ],
  properties: {
    publicSummary: { type: "string" },
    privateSummaries: {
      type: "array",
      items: createStrictObjectJsonSchema({
        required: ["playerId", "factionId", "summary", "tags"],
        properties: {
          playerId: { type: ["string", "null"] },
          factionId: { type: "string" },
          summary: { type: "string" },
          tags: {
            type: "array",
            items: { type: "string" }
          }
        }
      })
    },
    effects: {
      type: "array",
      items: { type: "string" }
    },
    recommendationLabels: {
      type: "array",
      items: { type: "string" }
    },
    riskLabels: {
      type: "array",
      items: { type: "string" }
    },
    recommendedNextOptionIds: {
      type: "array",
      items: { type: "string" }
    },
    worldUpdateSuggestions: {
      type: "array",
      items: createStrictObjectJsonSchema({
        required: ["key", "direction", "magnitude", "rationale"],
        properties: {
          key: {
            type: "string",
            enum: ["worldTension", "escalationRiskPercent"]
          },
          direction: {
            type: "string",
            enum: ["increase", "decrease", "hold"]
          },
          magnitude: {
            type: "string",
            enum: ["low", "medium", "high"]
          },
          rationale: { type: "string" }
        }
      })
    },
    llmNarrative: createStrictObjectJsonSchema({
      required: [
        "headline",
        "publicSummary",
        "privateUpdates",
        "consequenceTags",
        "followupHooks",
        "metadata"
      ],
      properties: {
        headline: { type: "string" },
        publicSummary: { type: "string" },
        privateUpdates: {
          type: "array",
          items: createStrictObjectJsonSchema({
            required: ["factionId", "summary", "tags"],
            properties: {
              factionId: { type: "string" },
              summary: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" }
              }
            }
          })
        },
        consequenceTags: {
          type: "array",
          items: { type: "string" }
        },
        followupHooks: {
          type: "array",
          items: { type: "string" }
        },
        metadata: strictEmptyObjectJsonSchema
      }
    }),
    metadata: strictEmptyObjectJsonSchema
  }
});

export const advisorResponsePayloadJsonSchema = createStrictObjectJsonSchema({
  required: [
    "summary",
    "shortAnswer",
    "rationale",
    "recommendationBand",
    "confidenceLabel",
    "recommendedOptionIds",
    "confidencePercent",
    "riskNotes",
    "assumptions",
    "metadata"
  ],
  properties: {
    summary: { type: "string" },
    shortAnswer: { type: "string" },
    rationale: {
      type: "array",
      items: { type: "string" }
    },
    recommendationBand: {
      type: "string",
      enum: ["low", "medium", "high", "uncertain"]
    },
    confidenceLabel: {
      type: "string",
      enum: ["low", "medium", "high", "uncertain"]
    },
    recommendedOptionIds: {
      type: "array",
      items: { type: "string" }
    },
    confidencePercent: { type: "number" },
    riskNotes: {
      type: "array",
      items: { type: "string" }
    },
    assumptions: {
      type: "array",
      items: { type: "string" }
    },
    metadata: strictEmptyObjectJsonSchema
  }
});

export const botDecisionPayloadJsonSchema = createStrictObjectJsonSchema({
  required: ["optionId", "rationale", "metadata"],
  properties: {
    optionId: { type: "string" },
    rationale: { type: "string" },
    metadata: strictEmptyObjectJsonSchema
  }
});
