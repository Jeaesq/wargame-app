import type {
  AdvisorAnswer,
  Game,
  ScenarioDefinition,
  TargetGameLength,
  TurnAction,
  TurnResolution
} from "@wargame/shared";
import type { AdvisorVisibleContext } from "../repositories/contracts.js";

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

export type BotMoveInput = {
  game: Game;
  scenario: ScenarioDefinition;
  factionId: string;
};

export type BotMoveDecision = {
  optionId: string;
  rationale: string;
};

export interface BotStrategyService {
  chooseAction(input: BotMoveInput): Promise<BotMoveDecision | null>;
}

export type GenerateAdvisorAnswerInput = {
  scenario: ScenarioDefinition;
  targetGameLength: TargetGameLength;
  question: string;
  context: AdvisorVisibleContext;
  answerId?: string;
};

export interface AdvisorService {
  generateAdvisorAnswer(input: GenerateAdvisorAnswerInput): Promise<AdvisorAnswer>;
}
