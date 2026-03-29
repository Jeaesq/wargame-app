import { Router, type ApiServices } from "./http/router.js";
import { registerAdvisorRoutes } from "./routes/advisor-routes.js";
import { registerGameRoutes } from "./routes/games-routes.js";
import { registerHealthRoutes } from "./routes/health-routes.js";
import { registerTurnRoutes } from "./routes/turns-routes.js";
import { getScenarioDefinitions } from "./scenarios/index.js";
import { InMemoryGameRepository } from "./services/in-memory-game-repository.js";
import { InMemoryScenarioRepository } from "./services/in-memory-scenario-repository.js";
import { StaticAdvisorService } from "./services/static-advisor-service.js";
import { StaticBotStrategyService } from "./services/static-bot-strategy-service.js";
import { StaticTurnResolutionService } from "./services/static-turn-resolution-service.js";

export function createApp() {
  const now = () => new Date().toISOString();
  const services: ApiServices = {
    advisorService: new StaticAdvisorService(now),
    botStrategyService: new StaticBotStrategyService(),
    gameRepository: new InMemoryGameRepository(),
    scenarioRepository: new InMemoryScenarioRepository(getScenarioDefinitions()),
    turnResolutionService: new StaticTurnResolutionService(now),
    now
  };

  const router = new Router(services);

  registerHealthRoutes(router);
  registerGameRoutes(router);
  registerTurnRoutes(router);
  registerAdvisorRoutes(router);

  return router;
}
