import type {
  AdvisorAnswer,
  ChoiceOption,
  Game,
  ScenarioDefinition,
  TurnResolution
} from "@wargame/shared";

export type SessionViewSelection = {
  playerId?: string;
  factionId?: string | null;
  view?: "default" | "public" | "faction" | "system";
};

export interface GameSessionRepository {
  listSessions(): Promise<Game[]>;
  getSessionById(sessionId: string): Promise<Game | null>;
  saveSession(session: Game): Promise<void>;
}

export interface TurnRepository {
  listTurnsBySessionId(sessionId: string): Promise<TurnResolution[]>;
  appendTurn(sessionId: string, turn: TurnResolution): Promise<void>;
}

export interface ScenarioRepository {
  listScenarios(): Promise<ScenarioDefinition[]>;
  getScenarioById(scenarioId: string): Promise<ScenarioDefinition | null>;
}

export interface SessionViewRepository {
  getSessionForPlayerView(
    input: SessionViewSelection & {
      sessionId: string;
    }
  ): Promise<Game | null>;
}

export type AdvisorVisibleContext = {
  gameId: string;
  turnNumber: number;
  factionId: string | null;
  playerId?: string;
  publicState: Game["state"]["public"];
  visibleOptions: ChoiceOption[];
  visibleWarnings: string[];
  lastAdvisorAnswer: AdvisorAnswer | null;
};

export interface AdvisorContextRepository {
  getAdvisorContext(input: {
    sessionId: string;
    playerId?: string;
    factionId?: string | null;
  }): Promise<AdvisorVisibleContext | null>;
}
