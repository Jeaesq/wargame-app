import {
  advisorResponsePayloadSchema,
  botDecisionPayloadSchema,
  turnGenerationArtifactsSchema,
  type AdvisorResponsePayload,
  type BotDecisionPayload,
  type TurnGenerationArtifacts
} from "@wargame/shared";

export function mapOpenAITurnGenerationOutput(
  payload: unknown
): TurnGenerationArtifacts {
  return turnGenerationArtifactsSchema.parse(payload);
}

export function mapOpenAIAdvisorResponseOutput(
  payload: unknown
): AdvisorResponsePayload {
  return advisorResponsePayloadSchema.parse(payload);
}

export function mapOpenAIBotDecisionOutput(payload: unknown): BotDecisionPayload {
  return botDecisionPayloadSchema.parse(payload);
}
