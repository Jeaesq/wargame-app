import {
  advisorAnswerSchema,
  advisorResponsePayloadSchema
} from "@wargame/shared";
import { randomUUID } from "node:crypto";
import { logInfo } from "../logger.js";
import type { AdvisorResponseProvider } from "../providers/types.js";
import type { AdvisorService, GenerateAdvisorAnswerInput } from "./types.js";

function sanitizeRecommendedOptionIds(input: {
  recommendedOptionIds: string[];
  visibleOptionIds: string[];
}) {
  const allowedIds = new Set(input.visibleOptionIds);

  return [...new Set(input.recommendedOptionIds)].filter((optionId) =>
    allowedIds.has(optionId)
  );
}

export class ProviderBackedAdvisorService implements AdvisorService {
  constructor(
    private readonly provider: AdvisorResponseProvider,
    private readonly now: () => string
  ) {}

  async generateAdvisorAnswer(input: GenerateAdvisorAnswerInput) {
    const rawResponse = await this.provider.generateAdvisorResponse({
      scenario: input.scenario,
      targetGameLength: input.targetGameLength,
      question: input.question,
      context: input.context
    });
    const payload = advisorResponsePayloadSchema.parse(rawResponse);
    const recommendedOptionIds = sanitizeRecommendedOptionIds({
      recommendedOptionIds: payload.recommendedOptionIds,
      visibleOptionIds: input.context.visibleOptions.map((option) => option.id)
    });

    logInfo("Advisor answer validated.", {
      providerResult: String(payload.metadata.provider ?? "unknown"),
      usedFallback: Boolean(payload.metadata.fallbackProvider),
      gameId: input.context.gameId,
      turnNumber: input.context.turnNumber
    });

    return advisorAnswerSchema.parse({
      answerId: randomUUID(),
      gameId: input.context.gameId,
      turnNumber: input.context.turnNumber,
      perspectiveFactionId: input.context.factionId,
      question: input.question,
      summary: payload.summary,
      shortAnswer: payload.shortAnswer,
      rationale: payload.rationale,
      recommendationBand: payload.recommendationBand,
      confidenceLabel: payload.confidenceLabel,
      recommendedOptionIds,
      confidencePercent: payload.confidencePercent,
      riskNotes: payload.riskNotes,
      assumptions: payload.assumptions,
      metadata: {
        ...payload.metadata,
        generatedAt: this.now()
      }
    });
  }
}
