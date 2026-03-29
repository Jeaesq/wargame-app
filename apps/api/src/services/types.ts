import type {
  AdvisorAnswer,
  Game,
  ScenarioDefinition,
  TurnAction,
  TurnResolution
} from "@wargame/shared";

export interface GameRepository {
  listGames(): Promise<Game[]>;
  getGameById(gameId: string): Promise<Game | null>;
  saveGame(game: Game): Promise<void>;
  listTurnResolutions(gameId: string): Promise<TurnResolution[]>;
  appendTurnResolution(game: Game, resolution: TurnResolution): Promise<void>;
}

export interface ScenarioRepository {
  listScenarios(): Promise<ScenarioDefinition[]>;
  getScenarioById(scenarioId: string): Promise<ScenarioDefinition | null>;
}

export type ResolveTurnInput = {
  game: Game;
  scenario: ScenarioDefinition;
  action: TurnAction;
};

export type ResolveTurnResult = {
  updatedGame: Game;
  resolution: TurnResolution;
};

export interface TurnResolutionService {
  resolveTurn(input: ResolveTurnInput): Promise<ResolveTurnResult>;
}

export type GenerateAdvisorAnswerInput = {
  game: Game;
  scenario: ScenarioDefinition;
  factionId: string | null;
};

export interface AdvisorService {
  generateAdvisorAnswer(input: GenerateAdvisorAnswerInput): Promise<AdvisorAnswer>;
}
