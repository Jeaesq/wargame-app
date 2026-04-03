import type {
  AdvisorAnswer,
  ChoiceOption,
  Game,
  ScenarioDefinition,
  TurnResolution
} from "@wargame/shared";
import type { VisibleAdvisorFraming } from "../services/advisor-framing-service.js";
import type { VisibleStrategicAssessment } from "../services/faction-strategy-context.js";

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
  likelyOpponentFactionId: string | null;
  publicState: Game["state"]["public"];
  visibleOutcome: Game["state"]["derived"]["outcome"];
  visibleOptions: ChoiceOption[];
  visibleWarnings: string[];
  privateBriefing: string | null;
  visibleIntelligence: string[];
  strategicAssessment: VisibleStrategicAssessment | null;
  likelyOpponentAssessment: VisibleStrategicAssessment | null;
  advisorFraming: VisibleAdvisorFraming | null;
  lastAdvisorAnswer: AdvisorAnswer | null;
};

export interface AdvisorContextRepository {
  getAdvisorContext(input: {
    sessionId: string;
    playerId?: string;
    factionId?: string | null;
  }): Promise<AdvisorVisibleContext | null>;
}
