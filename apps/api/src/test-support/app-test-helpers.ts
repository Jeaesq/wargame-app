import {
  gameSchema,
  type CreateGameRequest
} from "@wargame/shared";
import { createApiServices } from "../composition.js";
import type { AppConfig } from "../config.js";

const testConfig: AppConfig = {
  port: 0,
  persistence: {
    mode: "memory"
  },
  identity: {
    userIdHeader: "x-wargame-user-id",
    userNameHeader: "x-wargame-user-name",
    defaultUserId: "local-dev-user"
  },
  providers: {
    advisor: "mock",
    turn: "mock",
    bot: "mock",
    openai: null
  },
  database: null
};

export const defaultTestUserId = "local-dev-user";

export function createServices() {
  return createApiServices(testConfig);
}

export async function createSoloGame() {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-cold-war-berlin-mvp",
    mode: "solo",
    targetGameLength: "medium",
    players: [
      {
        name: "Player One",
        role: "human",
        factionId: "faction-usa"
      }
    ]
  };

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}

export async function createSeededSoloGame(seed: string) {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-cold-war-berlin-mvp",
    mode: "solo",
    targetGameLength: "medium",
    debug: {
      deterministicMode: true,
      seed
    },
    players: [
      {
        name: "Player One",
        role: "human",
        factionId: "faction-usa"
      }
    ]
  };

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}

export async function createHeadToHeadGame() {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-cold-war-berlin-mvp",
    mode: "head_to_head",
    targetGameLength: "medium",
    players: [
      {
        name: "Player USA",
        role: "human",
        factionId: "faction-usa"
      },
      {
        name: "Player USSR",
        role: "human",
        factionId: "faction-ussr"
      }
    ]
  };

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}

export async function createSuezSoloGame() {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-suez-crisis-mvp",
    mode: "solo",
    targetGameLength: "medium",
    players: [
      {
        name: "Canal Player",
        role: "human",
        factionId: "faction-anglo-french"
      }
    ]
  };

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}

export async function createShortSuezSoloGame(factionId = "faction-egypt") {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-suez-crisis-mvp",
    mode: "solo",
    targetGameLength: "short",
    players: [
      {
        name: "Canal Player",
        role: "human",
        factionId
      }
    ]
  };

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}

export async function createSeededSuezSoloGame(
  seed: string,
  factionId = "faction-anglo-french"
) {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-suez-crisis-mvp",
    mode: "solo",
    targetGameLength: "medium",
    debug: {
      deterministicMode: true,
      seed
    },
    players: [
      {
        name: "Canal Player",
        role: "human",
        factionId
      }
    ]
  };

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}
