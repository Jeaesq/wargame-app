import { advisorAnswerSchema, gameSchema } from "@wargame/shared";
import { z } from "zod";
import { NotFoundError } from "../errors/app-error.js";
import type { Router } from "../http/router.js";
import { readJsonBody } from "../http/request.js";
import { sendJson } from "../http/response.js";
import { validateWithSchema } from "../http/validation.js";

const advisorRequestSchema = z.object({
  factionId: z.string().min(1).nullable().optional()
});

export function registerAdvisorRoutes(router: Router): void {
  router.register(
    "POST",
    "/games/:gameId/advisor",
    async ({ params, request, response, services }) => {
      const body = (await readJsonBody(request)) ?? {};
      const input = validateWithSchema(
        advisorRequestSchema,
        body,
        "Advisor payload is invalid."
      );

      const game = await services.gameRepository.getGameById(params.gameId);

      if (!game) {
        throw new NotFoundError(`Game ${params.gameId} was not found.`);
      }

      const scenario = await services.scenarioRepository.getScenarioById(game.scenarioId);

      if (!scenario) {
        throw new NotFoundError(`Scenario ${game.scenarioId} was not found.`);
      }

      const answer = await services.advisorService.generateAdvisorAnswer({
        game,
        scenario,
        factionId: input.factionId ?? game.currentFactionId
      });

      const updatedGame = gameSchema.parse({
        ...game,
        advisorAnswers: [...game.advisorAnswers, answer],
        updatedAt: services.now()
      });

      await services.gameRepository.saveGame(updatedGame);

      sendJson(response, 200, advisorAnswerSchema.parse(answer));
    }
  );
}
