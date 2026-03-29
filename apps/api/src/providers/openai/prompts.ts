import type {
  AdvisorResponseProviderInput,
  BotDecisionProviderInput,
  TurnGenerationProviderInput
} from "../types.js";

export function buildOpenAITurnGenerationPrompt(
  input: TurnGenerationProviderInput
): {
  instructions: string;
  prompt: string;
} {
  return {
    instructions:
      "You are generating structured narrative artifacts for a Cold War crisis simulation. The backend already decided the canonical action, world-state deltas, turn order, and legal moves. Do not invent or override rules outcomes. Return only JSON matching the requested schema.",
    prompt: JSON.stringify(
      {
        task: "Generate turn narration artifacts only.",
        scenario: {
          id: input.scenario.id,
          title: input.scenario.title,
          historicalFrame: input.scenario.historicalFrame
        },
        turn: {
          currentTurnNumber: input.game.turnNumber,
          nextTurnNumber: input.nextTurnNumber
        },
        publicState: {
          headline: input.game.state.public.headline,
          publicNarrative: input.game.state.public.publicNarrative,
          worldTension: input.game.state.public.worldTension,
          nextWorldTension: input.nextWorldTension
        },
        actor: {
          playerName: input.actingPlayer.name,
          factionId: input.action.factionId
        },
        selectedAction: {
          optionId: input.selectedOption.id,
          title: input.selectedOption.title,
          summary: input.selectedOption.summary,
          kind: input.selectedOption.kind,
          recommendationPercent: input.selectedOption.recommendationPercent
        },
        deterministicOutcome: {
          tensionDelta: input.tensionDelta,
          nextFactionId: input.nextFactionId
        },
        rules: [
          "Use only the supplied state and outcome context.",
          "Do not add hidden facts that contradict the provided data.",
          "Keep summaries concise and gameplay-usable."
        ]
      },
      null,
      2
    )
  };
}

export function buildOpenAIAdvisorPrompt(
  input: AdvisorResponseProviderInput
): {
  instructions: string;
  prompt: string;
} {
  return {
    instructions:
      "You are an advisor for a Cold War crisis simulation. Answer only from player-visible information supplied in the prompt. Do not infer hidden intelligence or secret state. Return only JSON matching the requested schema.",
    prompt: JSON.stringify(
      {
        task: "Answer a player question from visible state only.",
        scenario: {
          id: input.scenario.id,
          title: input.scenario.title
        },
        question: input.question,
        visibleState: {
          turnNumber: input.context.turnNumber,
          factionId: input.context.factionId,
          publicState: input.context.publicState,
          visibleOptions: input.context.visibleOptions,
          visibleWarnings: input.context.visibleWarnings
        },
        rules: [
          "Do not mention hidden information.",
          "Recommendation percentages are advisory, not certain.",
          "Keep the answer practical and short."
        ]
      },
      null,
      2
    )
  };
}

export function buildOpenAIBotDecisionPrompt(
  input: BotDecisionProviderInput
): {
  instructions: string;
  prompt: string;
} {
  return {
    instructions:
      "You are selecting one legal bot action for the current faction in a Cold War crisis simulation. The backend remains the source of truth and supplied all valid choices. Return only JSON matching the requested schema.",
    prompt: JSON.stringify(
      {
        task: "Select a single legal option for the bot faction.",
        scenario: {
          id: input.scenario.id,
          title: input.scenario.title
        },
        factionId: input.factionId,
        publicState: input.publicState,
        visibleOptions: input.visibleOptions,
        rules: [
          "Choose exactly one of the provided option ids.",
          "Do not invent new actions.",
          "Provide a concise rationale."
        ]
      },
      null,
      2
    )
  };
}
