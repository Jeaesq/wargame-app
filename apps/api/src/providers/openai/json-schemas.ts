// These JSON Schemas are intentionally narrow and pragmatic.
// They are suitable for an initial Responses API integration skeleton,
// but they are not yet production-complete contracts.

export const turnGenerationArtifactsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "publicSummary",
    "privateSummaries",
    "effects",
    "recommendationLabels",
    "riskLabels",
    "llmNarrative",
    "metadata"
  ],
  properties: {
    publicSummary: { type: "string" },
    privateSummaries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
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
      }
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
    llmNarrative: {
      type: "object",
      additionalProperties: false,
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
          items: {
            type: "object",
            additionalProperties: false,
            required: ["factionId", "summary", "tags"],
            properties: {
              factionId: { type: "string" },
              summary: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        consequenceTags: {
          type: "array",
          items: { type: "string" }
        },
        followupHooks: {
          type: "array",
          items: { type: "string" }
        },
        metadata: {
          type: "object",
          additionalProperties: true
        }
      }
    },
    metadata: {
      type: "object",
      additionalProperties: true
    }
  }
} as const;

export const advisorResponsePayloadJsonSchema = {
  type: "object",
  additionalProperties: false,
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
    metadata: {
      type: "object",
      additionalProperties: true
    }
  }
} as const;

export const botDecisionPayloadJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["optionId", "rationale", "metadata"],
  properties: {
    optionId: { type: "string" },
    rationale: { type: "string" },
    metadata: {
      type: "object",
      additionalProperties: true
    }
  }
} as const;
