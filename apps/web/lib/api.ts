import {
  createGameRequestSchema,
  createTurnRequestSchema,
  gameSchema,
  gamesListResponseSchema,
  scenarioDefinitionSchema,
  scenariosListResponseSchema,
  turnResolutionResponseSchema,
  turnsListResponseSchema,
  type CreateGameRequest,
  type CreateTurnRequest,
  type Game,
  type ScenarioDefinition,
  type TurnResolution
} from "@wargame/shared";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

async function apiRequest<T>(path: string, init: RequestInit, schema: {
  parse: (input: unknown) => T;
}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: { message?: string } }).error?.message ?? "Request failed.")
        : "Request failed.";
    throw new Error(message);
  }

  return schema.parse(payload);
}

export async function getScenarios(): Promise<ScenarioDefinition[]> {
  const response = await apiRequest(
    "/scenarios",
    { method: "GET" },
    scenariosListResponseSchema
  );

  return response.scenarios.map((scenario) => scenarioDefinitionSchema.parse(scenario));
}

export async function getGames(): Promise<Game[]> {
  const response = await apiRequest("/games", { method: "GET" }, gamesListResponseSchema);
  return response.games.map((game) => gameSchema.parse(game));
}

export async function getGame(gameId: string): Promise<Game> {
  return apiRequest(`/games/${gameId}`, { method: "GET" }, gameSchema);
}

export async function getTurnHistory(gameId: string): Promise<TurnResolution[]> {
  const response = await apiRequest(
    `/games/${gameId}/turns`,
    { method: "GET" },
    turnsListResponseSchema
  );

  return response.turns;
}

export async function createGame(input: CreateGameRequest): Promise<Game> {
  const body = createGameRequestSchema.parse(input);

  return apiRequest(
    "/games",
    {
      method: "POST",
      body: JSON.stringify(body)
    },
    gameSchema
  );
}

export async function submitTurn(
  gameId: string,
  input: CreateTurnRequest
): Promise<{ game: Game; resolution: TurnResolution }> {
  const body = createTurnRequestSchema.parse(input);

  return apiRequest(
    `/games/${gameId}/turns`,
    {
      method: "POST",
      body: JSON.stringify(body)
    },
    turnResolutionResponseSchema
  );
}
