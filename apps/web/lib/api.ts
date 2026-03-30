import {
  advisorAnswerSchema,
  advisorQuestionRequestSchema,
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
  type TurnResolution,
  type AdvisorAnswer
} from "@wargame/shared";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";
const developmentUserId = process.env.WARGAME_DEV_USER_ID;
const developmentUserName = process.env.WARGAME_DEV_USER_NAME;

function buildIdentityHeaders(): Record<string, string> {
  return {
    ...(developmentUserId ? { "x-wargame-user-id": developmentUserId } : {}),
    ...(developmentUserName ? { "x-wargame-user-name": developmentUserName } : {})
  };
}

async function apiRequest<T>(path: string, init: RequestInit, schema: {
  parse: (input: unknown) => T;
}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...buildIdentityHeaders(),
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

export async function getGame(
  gameId: string,
  input?: {
    playerId?: string;
    factionId?: string | null;
  }
): Promise<Game> {
  const query = new URLSearchParams();

  if (input?.playerId) {
    query.set("playerId", input.playerId);
  }

  if (input?.factionId) {
    query.set("factionId", input.factionId);
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiRequest(`/games/${gameId}${suffix}`, { method: "GET" }, gameSchema);
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
): Promise<{
  game: Game;
  resolution: TurnResolution;
  followupResolutions: TurnResolution[];
}> {
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

export async function askAdvisor(
  gameId: string,
  input: {
    question: string;
    factionId?: string | null;
    playerId?: string;
  }
): Promise<AdvisorAnswer> {
  const body = advisorQuestionRequestSchema.parse(input);

  return apiRequest(
    `/games/${gameId}/advisor`,
    {
      method: "POST",
      body: JSON.stringify(body)
    },
    advisorAnswerSchema
  );
}

export type AdvisorStreamEvent =
  | {
      event: "status";
      data: {
        stage: string;
      };
    }
  | {
      event: "answer";
      data: AdvisorAnswer;
    }
  | {
      event: "done";
      data: {
        ok: boolean;
      };
    }
  | {
      event: "error";
      data: {
        message: string;
        code: string;
      };
    };

export async function askAdvisorStream(
  gameId: string,
  input: {
    question: string;
    factionId?: string | null;
    playerId?: string;
  }
): Promise<ReadableStream<AdvisorStreamEvent>> {
  const body = advisorQuestionRequestSchema.parse(input);
  const response = await fetch(`${apiBaseUrl}/games/${gameId}/advisor/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...buildIdentityHeaders()
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: { message?: string } }).error?.message ?? "Request failed.")
        : "Request failed.";
    throw new Error(message);
  }

  return createAdvisorEventStream(response.body);
}

function createAdvisorEventStream(
  body: ReadableStream<Uint8Array>
): ReadableStream<AdvisorStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<AdvisorStreamEvent>({
    async pull(controller) {
      while (true) {
        const boundaryIndex = buffer.indexOf("\n\n");

        if (boundaryIndex >= 0) {
          const chunk = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);
          const event = parseAdvisorStreamChunk(chunk);

          if (event) {
            controller.enqueue(event);
          }

          return;
        }

        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim().length > 0) {
            const event = parseAdvisorStreamChunk(buffer);
            if (event) {
              controller.enqueue(event);
            }
          }

          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
      }
    }
  });
}

function parseAdvisorStreamChunk(chunk: string): AdvisorStreamEvent | null {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const eventLine = lines.find((line) => line.startsWith("event:"));
  const dataLine = lines.find((line) => line.startsWith("data:"));

  if (!eventLine || !dataLine) {
    return null;
  }

  const event = eventLine.slice("event:".length).trim();
  const data = JSON.parse(dataLine.slice("data:".length).trim()) as unknown;

  switch (event) {
    case "status":
      return {
        event: "status",
        data: {
          stage: String((data as { stage?: unknown }).stage ?? "unknown")
        }
      };
    case "answer":
      return {
        event: "answer",
        data: advisorAnswerSchema.parse(data)
      };
    case "done":
      return {
        event: "done",
        data: {
          ok: Boolean((data as { ok?: unknown }).ok)
        }
      };
    case "error":
      return {
        event: "error",
        data: {
          message: String((data as { message?: unknown }).message ?? "Request failed."),
          code: String((data as { code?: unknown }).code ?? "INTERNAL_ERROR")
        }
      };
    default:
      return null;
  }
}
