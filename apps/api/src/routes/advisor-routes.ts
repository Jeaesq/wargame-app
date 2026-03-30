import {
  advisorAnswerSchema,
  advisorQuestionRequestSchema
} from "@wargame/shared";
import { isAppError } from "../errors/app-error.js";
import type { Router } from "../http/router.js";
import { readJsonBody } from "../http/request.js";
import {
  beginEventStream,
  sendEventStreamMessage,
  sendJson
} from "../http/response.js";
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

  router.register(
    "POST",
    "/games/:gameId/advisor/stream",
    async ({ params, request, response, services }) => {
      const body = (await readJsonBody(request)) ?? {};
      const input = validateWithSchema(
        advisorQuestionRequestSchema,
        body,
        "Advisor payload is invalid."
      );

      beginEventStream(response);
      sendEventStreamMessage(response, "status", {
        stage: "started"
      });

      try {
        const answer = await services.advisorQaService.askQuestion({
          sessionId: params.gameId,
          factionId: input.factionId,
          playerId: input.playerId,
          question: input.question
        });

        sendEventStreamMessage(response, "answer", advisorAnswerSchema.parse(answer));
        sendEventStreamMessage(response, "done", {
          ok: true
        });
      } catch (error) {
        sendEventStreamMessage(response, "error", {
          message:
            isAppError(error) || error instanceof Error
              ? error.message
              : "Unable to query the advisor.",
          code: isAppError(error) ? error.code : "INTERNAL_ERROR"
        });
      } finally {
        response.end();
      }
    }
  );
}
