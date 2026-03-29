import { getAppConfig, type AppConfig } from "./config.js";
import type { ApiServices } from "./http/router.js";
import { createPostgresPool } from "./db/pool.js";
import { RepositoryBackedAdvisorContextRepository } from "./repositories/advisor-context-repository.js";
import { InMemoryGameSessionRepository } from "./repositories/in-memory/game-session-repository.js";
import { InMemoryStore } from "./repositories/in-memory/store.js";
import { InMemoryTurnRepository } from "./repositories/in-memory/turn-repository.js";
import { PostgresGameSessionRepository } from "./repositories/postgres/game-session-repository.js";
import { PostgresTurnRepository } from "./repositories/postgres/turn-repository.js";
import { RepositoryBackedSessionViewRepository } from "./repositories/session-view-repository.js";
import { StaticScenarioRepository } from "./repositories/static-scenario-repository.js";
import type {
  GameSessionRepository,
  TurnRepository
} from "./repositories/contracts.js";
import { getScenarioDefinitions } from "./scenarios/index.js";
import { AdvisorQaService } from "./services/advisor-qa-service.js";
import { GameSessionService } from "./services/game-session-service.js";
import { StaticAdvisorService } from "./services/static-advisor-service.js";
import { StaticBotStrategyService } from "./services/static-bot-strategy-service.js";
import { StaticTurnResolutionService } from "./services/static-turn-resolution-service.js";
import { TurnSubmissionService } from "./services/turn-submission-service.js";

function createPersistenceRepositories(config: AppConfig): {
  gameSessionRepository: GameSessionRepository;
  turnRepository: TurnRepository;
} {
  if (config.persistence.mode === "postgres") {
    const database = config.database;

    if (!database) {
      throw new Error("Database configuration is required for postgres mode.");
    }

    const pool = createPostgresPool(database);

    return {
      gameSessionRepository: new PostgresGameSessionRepository(pool),
      turnRepository: new PostgresTurnRepository(pool)
    };
  }

  const store = new InMemoryStore();

  return {
    gameSessionRepository: new InMemoryGameSessionRepository(store),
    turnRepository: new InMemoryTurnRepository(store)
  };
}

export function createApiServices(config: AppConfig = getAppConfig()): ApiServices {
  const now = () => new Date().toISOString();
  const { gameSessionRepository, turnRepository } = createPersistenceRepositories(
    config
  );
  const scenarioRepository = new StaticScenarioRepository(getScenarioDefinitions());
  const sessionViewRepository = new RepositoryBackedSessionViewRepository(
    gameSessionRepository
  );
  const advisorContextRepository = new RepositoryBackedAdvisorContextRepository(
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
