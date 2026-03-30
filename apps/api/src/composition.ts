import { getAppConfig, type AppConfig } from "./config.js";
import type { ApiServices } from "./http/router.js";
import { createPostgresPool } from "./db/pool.js";
import { MockAdvisorResponseProvider } from "./providers/mock/mock-advisor-response-provider.js";
import { MockBotDecisionProvider } from "./providers/mock/mock-bot-decision-provider.js";
import { MockTurnGenerationProvider } from "./providers/mock/mock-turn-generation-provider.js";
import { OpenAIAdvisorResponseProvider } from "./providers/openai/openai-advisor-response-provider.js";
import { OpenAIBotDecisionProvider } from "./providers/openai/openai-bot-decision-provider.js";
import { OpenAITurnGenerationProvider } from "./providers/openai/openai-turn-generation-provider.js";
import { OpenAIResponsesClient } from "./providers/openai/response-client.js";
import type {
  AdvisorResponseProvider,
  BotDecisionProvider,
  TurnGenerationProvider
} from "./providers/types.js";
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
import { logInfo } from "./logger.js";
import { AdvisorQaService } from "./services/advisor-qa-service.js";
import { GameSessionService } from "./services/game-session-service.js";
import { ProviderBackedAdvisorService } from "./services/provider-backed-advisor-service.js";
import { ProviderBackedBotStrategyService } from "./services/provider-backed-bot-strategy-service.js";
import { ProviderBackedTurnResolutionService } from "./services/provider-backed-turn-resolution-service.js";
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

function createProviders(config: AppConfig): {
  turnGenerationProvider: TurnGenerationProvider;
  botDecisionProvider: BotDecisionProvider;
  advisorResponseProvider: AdvisorResponseProvider;
} {
  const openai = config.providers.openai;
  const client = openai ? new OpenAIResponsesClient(openai) : null;

  const advisorResponseProvider =
    config.providers.advisor === "openai"
      ? createOpenAIAdvisorProvider(client)
      : new MockAdvisorResponseProvider();
  const turnGenerationProvider =
    config.providers.turn === "openai"
      ? createOpenAITurnProvider(client)
      : new MockTurnGenerationProvider();
  const botDecisionProvider =
    config.providers.bot === "openai"
      ? createOpenAIBotProvider(client)
      : new MockBotDecisionProvider();

  return {
    turnGenerationProvider,
    botDecisionProvider,
    advisorResponseProvider
  };
}

function createOpenAIAdvisorProvider(
  client: OpenAIResponsesClient | null
): AdvisorResponseProvider {
  if (!client) {
    throw new Error("ADVISOR_PROVIDER=openai requires server-side OpenAI config.");
  }

  return new OpenAIAdvisorResponseProvider(client);
}

function createOpenAITurnProvider(
  client: OpenAIResponsesClient | null
): TurnGenerationProvider {
  if (!client) {
    throw new Error("TURN_PROVIDER=openai requires server-side OpenAI config.");
  }

  return new OpenAITurnGenerationProvider(client);
}

function createOpenAIBotProvider(
  client: OpenAIResponsesClient | null
): BotDecisionProvider {
  if (!client) {
    throw new Error("BOT_PROVIDER=openai requires server-side OpenAI config.");
  }

  return new OpenAIBotDecisionProvider(client);
}

export function createApiServices(config: AppConfig = getAppConfig()): ApiServices {
  const now = () => new Date().toISOString();
  const { gameSessionRepository, turnRepository } = createPersistenceRepositories(
    config
  );
  const {
    turnGenerationProvider,
    botDecisionProvider,
    advisorResponseProvider
  } = createProviders(config);
  logInfo("Provider selection resolved.", {
    advisorProvider: config.providers.advisor,
    turnProvider: config.providers.turn,
    botProvider: config.providers.bot
  });
  const scenarioRepository = new StaticScenarioRepository(getScenarioDefinitions());
  const sessionViewRepository = new RepositoryBackedSessionViewRepository(
    gameSessionRepository
  );
  const advisorContextRepository = new RepositoryBackedAdvisorContextRepository(
    gameSessionRepository
  );

  const turnResolutionService = new ProviderBackedTurnResolutionService(
    turnGenerationProvider,
    now
  );
  const botStrategyService = new ProviderBackedBotStrategyService(botDecisionProvider);
  const advisorService = new ProviderBackedAdvisorService(
    advisorResponseProvider,
    now
  );

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
