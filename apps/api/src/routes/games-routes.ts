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

  router.register("GET", "/games", async ({ response, services }) => {
    const games = await services.gameSessionService.listSessions();

    sendJson(
      response,
      200,
      gamesListResponseSchema.parse({
        games: games.map((game) => gameSchema.parse(game))
      })
    );
  });

  router.register("GET", "/games/:gameId", async ({ params, response, services }) => {
    const game = await services.gameSessionService.getSession(params.gameId);

    sendJson(response, 200, gameSchema.parse(game));
  });

  router.register("POST", "/games", async ({ request, response, services }) => {
    const body = await readJsonBody(request);
    const input = validateWithSchema(
      createGameRequestSchema,
      body,
      "Game creation payload is invalid."
    );

    const game = await services.gameSessionService.createSession(input);

    sendJson(response, 201, gameSchema.parse(game));
  });
}
