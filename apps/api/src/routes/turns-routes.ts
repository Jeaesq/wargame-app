import {
  createTurnRequestSchema,
  gameSchema,
  turnActionSchema,
  turnResolutionResponseSchema,
  turnsListResponseSchema,
  turnResolutionSchema
} from "@wargame/shared";
import { NotFoundError, ValidationError } from "../errors/app-error.js";
import type { Router } from "../http/router.js";
import { readJsonBody } from "../http/request.js";
import { sendJson } from "../http/response.js";
import { validateWithSchema } from "../http/validation.js";
import { randomUUID } from "node:crypto";

export function registerTurnRoutes(router: Router): void {
  router.register(
    "GET",
    "/games/:gameId/turns",
    async ({ params, response, services }) => {
      const turns = await services.gameRepository.listTurnResolutions(params.gameId);

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
      const body = await readJsonBody(request);
      const input = validateWithSchema(
        createTurnRequestSchema,
        body,
        "Turn submission payload is invalid."
      );

      const game = await services.gameRepository.getGameById(params.gameId);

      if (!game) {
        throw new NotFoundError(`Game ${params.gameId} was not found.`);
      }

      const scenario = await services.scenarioRepository.getScenarioById(game.scenarioId);

      if (!scenario) {
        throw new NotFoundError(`Scenario ${game.scenarioId} was not found.`);
      }

      const privateState = game.state.privateByPlayer.find(
        (state) => state.playerId === input.playerId
      );
      const option = privateState?.availableOptions.find(
        (candidate) => candidate.id === input.optionId
      );

      if (!option) {
        throw new ValidationError(`Option ${input.optionId} is not available this turn.`);
      }

      const action = turnActionSchema.parse({
        id: randomUUID(),
        gameId: game.id,
        turnNumber: game.turnNumber,
        playerId: input.playerId,
        factionId: input.factionId,
        optionId: input.optionId,
        kind: option.kind,
        submittedAt: services.now(),
        declaredIntent: input.declaredIntent,
        parameters: input.parameters,
        clientContext: input.clientContext
      });

      const result = await services.turnResolutionService.resolveTurn({
        game,
        scenario,
        action
      });

      await services.gameRepository.appendTurnResolution(
        result.updatedGame,
        result.resolution
      );

      sendJson(
        response,
        201,
        turnResolutionResponseSchema.parse({
          game: gameSchema.parse(result.updatedGame),
          resolution: turnResolutionSchema.parse(result.resolution)
        })
      );
    }
  );
}
