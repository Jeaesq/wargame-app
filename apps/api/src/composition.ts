import type { ApiServices } from "./http/router.js";
import { getScenarioDefinitions } from "./scenarios/index.js";
import { InMemoryAdvisorContextRepository } from "./repositories/in-memory/advisor-context-repository.js";
import { InMemoryGameSessionRepository } from "./repositories/in-memory/game-session-repository.js";
import { InMemoryScenarioRepository } from "./repositories/in-memory/scenario-repository.js";
import { InMemorySessionViewRepository } from "./repositories/in-memory/session-view-repository.js";
import { InMemoryStore } from "./repositories/in-memory/store.js";
import { InMemoryTurnRepository } from "./repositories/in-memory/turn-repository.js";
import { AdvisorQaService } from "./services/advisor-qa-service.js";
import { GameSessionService } from "./services/game-session-service.js";
import { StaticAdvisorService } from "./services/static-advisor-service.js";
import { StaticBotStrategyService } from "./services/static-bot-strategy-service.js";
import { StaticTurnResolutionService } from "./services/static-turn-resolution-service.js";
import { TurnSubmissionService } from "./services/turn-submission-service.js";

export function createApiServices(): ApiServices {
  const now = () => new Date().toISOString();
  const store = new InMemoryStore();

  const gameSessionRepository = new InMemoryGameSessionRepository(store);
  const turnRepository = new InMemoryTurnRepository(store);
  const scenarioRepository = new InMemoryScenarioRepository(
    store,
    getScenarioDefinitions()
  );
  const sessionViewRepository = new InMemorySessionViewRepository(
    gameSessionRepository
  );
  const advisorContextRepository = new InMemoryAdvisorContextRepository(
    gameSessionRepository
  );

  const turnResolutionService = new StaticTurnResolutionService(now);
  const botStrategyService = new StaticBotStrategyService();
  const advisorService = new StaticAdvisorService(now);

  return {
    scenarioRepository,
    gameSessionService: new GameSessionService(
      gameSessionRepository,
      scenarioRepository,
      sessionViewRepository,
      now
    ),
    turnSubmissionService: new TurnSubmissionService(
      gameSessionRepository,
      sessionViewRepository,
      scenarioRepository,
      turnRepository,
      turnResolutionService,
      botStrategyService,
      now
    ),
    advisorQaService: new AdvisorQaService(
      gameSessionRepository,
      scenarioRepository,
      advisorContextRepository,
      advisorService,
      now
    )
  };
}
