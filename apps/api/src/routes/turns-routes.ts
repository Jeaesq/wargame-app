import {
  createTurnRequestSchema,
  gameSchema,
  turnResolutionResponseSchema,
  turnsListResponseSchema,
  turnResolutionSchema
} from "@wargame/shared";
import type { Router } from "../http/router.js";
import { readJsonBody } from "../http/request.js";
import { sendJson } from "../http/response.js";
import { validateWithSchema } from "../http/validation.js";

export function registerTurnRoutes(router: Router): void {
  router.register(
    "GET",
    "/games/:gameId/turns",
    async ({ params, response, services }) => {
      const turns = await services.turnSubmissionService.listTurns(params.gameId);
      sendJson(
        response,
        200,
        turnsListResponseSchema.parse({
          turns: turns.map((turn) => turnResolutionSchema.parse(turn))
        })
      );
    }
  );

  router.register(
    "POST",
    "/games/:gameId/turns",
    async ({ params, request, response, services }) => {
      const identity = services.requestIdentityService.resolveRequestIdentity(request);
      const body = await readJsonBody(request);
      const input = validateWithSchema(
        createTurnRequestSchema,
        body,
        "Turn submission payload is invalid."
      );

      const result = await services.turnSubmissionService.submitTurn(
        params.gameId,
        identity.userId,
        input
      );

      sendJson(
        response,
        201,
        turnResolutionResponseSchema.parse({
          game: gameSchema.parse(result.game),
          resolution: turnResolutionSchema.parse(result.resolution),
          followupResolutions: result.followupResolutions.map((resolution) =>
            turnResolutionSchema.parse(resolution)
          )
        })
      );
    }
  );
}
