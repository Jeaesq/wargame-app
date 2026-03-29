import {
  advisorAnswerSchema,
  advisorQuestionRequestSchema
} from "@wargame/shared";
import type { Router } from "../http/router.js";
import { readJsonBody } from "../http/request.js";
import { sendJson } from "../http/response.js";
import { validateWithSchema } from "../http/validation.js";

export function registerAdvisorRoutes(router: Router): void {
  router.register(
    "POST",
    "/games/:gameId/advisor",
    async ({ params, request, response, services }) => {
      const body = (await readJsonBody(request)) ?? {};
      const input = validateWithSchema(
        advisorQuestionRequestSchema,
        body,
        "Advisor payload is invalid."
      );

      const answer = await services.advisorQaService.askQuestion({
        sessionId: params.gameId,
        factionId: input.factionId,
        playerId: input.playerId,
        question: input.question
      });

      sendJson(response, 200, advisorAnswerSchema.parse(answer));
    }
  );
}
