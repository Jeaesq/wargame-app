import {
  createGameRequestSchema,
  gameSchema,
  gamesListResponseSchema,
  scenariosListResponseSchema
} from "@wargame/shared";
import type { Router } from "../http/router.js";
import { readJsonBody } from "../http/request.js";
import { sendJson } from "../http/response.js";
import { validateWithSchema } from "../http/validation.js";

export function registerGameRoutes(router: Router): void {
  router.register("GET", "/scenarios", async ({ response, services }) => {
    const scenarios = await services.scenarioRepository.listScenarios();

    sendJson(
      response,
      200,
      scenariosListResponseSchema.parse({
        scenarios
      })
    );
  });

  router.register("GET", "/games", async ({ request, response, services }) => {
    const identity = services.requestIdentityService.resolveRequestIdentity(request);
    const games = await services.gameSessionService.listSessions(identity.userId);

    sendJson(
      response,
      200,
      gamesListResponseSchema.parse({
        games: games.map((game) => gameSchema.parse(game))
      })
    );
  });

  router.register(
    "GET",
    "/games/:gameId",
    async ({ params, request, response, services, url }) => {
    const identity = services.requestIdentityService.resolveRequestIdentity(request);
    const game = await services.gameSessionService.getSession(params.gameId, identity.userId, {
      playerId: url.searchParams.get("playerId") || undefined,
      factionId: url.searchParams.get("factionId") || undefined
    });

    sendJson(response, 200, gameSchema.parse(game));
    }
  );

  router.register("POST", "/games", async ({ request, response, services }) => {
    const identity = services.requestIdentityService.resolveRequestIdentity(request);
    const body = await readJsonBody(request);
    const input = validateWithSchema(
      createGameRequestSchema,
      body,
      "Game creation payload is invalid."
    );

    const game = await services.gameSessionService.createSession(input, identity.userId);

    sendJson(response, 201, gameSchema.parse(game));
  });
}
