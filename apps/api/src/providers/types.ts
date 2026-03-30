import type {
  AdvisorResponsePayload,
  ChoiceOption,
  Game,
  PrivatePlayerState,
  PublicGameState,
  ScenarioDefinition,
  TargetGameLength,
  TurnAction,
  TurnGenerationArtifacts
} from "@wargame/shared";
import type { AdvisorVisibleContext } from "../repositories/contracts.js";

export type TurnGenerationProviderInput = {
  game: Game;
  scenario: ScenarioDefinition;
  targetGameLength: TargetGameLength;
  action: TurnAction;
  actingPlayer: Game["players"][number];
  actingPrivateState: PrivatePlayerState;
  selectedOption: ChoiceOption;
  nextFactionId: string | null;
  nextTurnNumber: number;
  tensionDelta: number;
  nextWorldTension: number;
  nextOptions: ChoiceOption[];
};

export interface TurnGenerationProvider {
  generateTurnArtifacts(input: TurnGenerationProviderInput): Promise<unknown>;
}

export type BotDecisionProviderInput = {
  game: Game;
  scenario: ScenarioDefinition;
  factionId: string;
  visibleOptions: ChoiceOption[];
  publicState: PublicGameState;
};

export interface BotDecisionProvider {
  chooseBotDecision(input: BotDecisionProviderInput): Promise<unknown>;
}

export type AdvisorResponseProviderInput = {
  scenario: ScenarioDefinition;
  targetGameLength: TargetGameLength;
  question: string;
  context: AdvisorVisibleContext;
};

export interface AdvisorResponseProvider {
  generateAdvisorResponse(input: AdvisorResponseProviderInput): Promise<unknown>;
}

export type ValidatedTurnGenerationArtifacts = TurnGenerationArtifacts;
export type ValidatedAdvisorResponsePayload = AdvisorResponsePayload;
