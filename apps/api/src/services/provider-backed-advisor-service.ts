import {
  advisorAnswerSchema,
  advisorResponsePayloadSchema
} from "@wargame/shared";
import { randomUUID } from "node:crypto";
import type { AdvisorResponseProvider } from "../providers/types.js";
import type { AdvisorService, GenerateAdvisorAnswerInput } from "./types.js";

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
      recommendedOptionIds: payload.recommendedOptionIds,
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
