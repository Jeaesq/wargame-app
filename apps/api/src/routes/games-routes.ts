import {
  gameModeSchema,
  gameSchema,
  playerRoleSchema
} from "@wargame/shared";
import { z } from "zod";
import { NotFoundError } from "../errors/app-error.js";
import type { Router } from "../http/router.js";
import { readJsonBody } from "../http/request.js";
import { sendJson } from "../http/response.js";
import { validateWithSchema } from "../http/validation.js";
import { buildGameFromScenario } from "../services/game-factory.js";

const createGameRequestSchema = z.object({
  scenarioId: z.string().min(1),
  mode: gameModeSchema,
  players: z
    .array(
      z.object({
        name: z.string().min(1),
        role: playerRoleSchema.default("human"),
        factionId: z.string().min(1).optional()
      })
    )
    .min(1)
});

export function registerGameRoutes(router: Router): void {
  router.register("GET", "/games", async ({ response, services }) => {
    const games = await services.gameRepository.listGames();
    sendJson(response, 200, {
      games: games.map((game) => gameSchema.parse(game))
    });
  });

  router.register("GET", "/games/:gameId", async ({ params, response, services }) => {
    const game = await services.gameRepository.getGameById(params.gameId);

    if (!game) {
      throw new NotFoundError(`Game ${params.gameId} was not found.`);
    }

    sendJson(response, 200, gameSchema.parse(game));
  });

  router.register("POST", "/games", async ({ request, response, services }) => {
    const body = await readJsonBody(request);
    const input = validateWithSchema(
      createGameRequestSchema,
      body,
      "Game creation payload is invalid."
    );

    const scenario = await services.scenarioRepository.getScenarioById(input.scenarioId);

    if (!scenario) {
      throw new NotFoundError(`Scenario ${input.scenarioId} was not found.`);
    }

    const game = buildGameFromScenario({
      now: services.now(),
      scenario,
      mode: input.mode,
      requestedPlayers: input.players
    });

    await services.gameRepository.saveGame(game);

    sendJson(response, 201, gameSchema.parse(game));
  });
}
