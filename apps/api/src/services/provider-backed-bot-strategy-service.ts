import { botDecisionPayloadSchema } from "@wargame/shared";
import { ValidationError } from "../errors/app-error.js";
import { logWarn } from "../logger.js";
import type { BotDecisionProvider } from "../providers/types.js";
import {
  buildFactionStrategicSnapshot,
  describeOptionFitForDoctrine,
  getStrategicCategory
} from "./faction-strategy-context.js";
import type {
  BotMoveDecision,
  BotMoveInput,
  BotStrategyService
} from "./types.js";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildStrategicScore(input: {
  move: BotMoveInput;
  option: BotMoveInput["game"]["state"]["privateByPlayer"][number]["availableOptions"][number];
}) {
  const { move, option } = input;
  const snapshot = buildFactionStrategicSnapshot({
    scenario: move.scenario,
    game: move.game,
    factionId: move.factionId
  });
  const pressureWindow = snapshot.hiddenTracks.pressureWindow ?? 50;
  const commandConfidence = snapshot.hiddenTracks.commandConfidence ?? 50;
  const allianceConfidence = snapshot.hiddenTracks.allianceConfidence ?? 50;
  const domesticPressure = snapshot.hiddenTracks.domesticPressure ?? 50;
  const coalitionUnity = snapshot.hiddenTracks.coalitionUnity ?? 50;
  const usPressure = snapshot.hiddenTracks.usPressure ?? 50;
  const regimeCohesion = snapshot.hiddenTracks.regimeCohesion ?? 50;
  const arabSupport = snapshot.hiddenTracks.arabSupport ?? 50;
  const leverageGain = option.effectProfile.negotiationLeverageDeltas[move.factionId] ?? 0;
  const momentumGain = option.effectProfile.factionMomentumDeltas[move.factionId] ?? 0;
  const category = getStrategicCategory(option);

  let score = option.recommendationPercent ?? 50;
  score += snapshot.doctrine.categoryBiases[category] ?? 0;

  if (snapshot.preferredCategories.has(category)) {
    score += 4;
  }

  if (snapshot.cautiousCategories.has(category) && snapshot.escalationRisk >= 65) {
    score -= 4;
  }

  if (snapshot.escalationRisk >= 75 || snapshot.worldTension >= 78) {
    if (option.effectProfile.worldTensionDelta <= 0 || option.effectProfile.escalationRiskDelta <= 0) {
      score += 18 + snapshot.doctrine.restraintBias;
    }
    if (category === "military") {
      score -= 18 + snapshot.doctrine.restraintBias;
    }
  }

  if (snapshot.behind) {
    score += leverageGain * 1.6 + momentumGain * 1.2;
    if (category === "military" || category === "economic") {
      score += 6 + snapshot.doctrine.pressureBias;
    }
  }

  if (!snapshot.behind && !snapshot.ahead && snapshot.escalationRisk < 70) {
    if (snapshot.preferredCategories.has(category)) {
      score += Math.round(snapshot.doctrine.initiativeBias * 0.8);
    }

    if (momentumGain > 0 || leverageGain > 0) {
      score += Math.round(snapshot.doctrine.initiativeBias * 0.5);
    }
  }

  if (snapshot.ahead && snapshot.escalationRisk >= 65) {
    if (category === "diplomatic" || category === "intelligence") {
      score += 8 + snapshot.doctrine.restraintBias;
    }
    if (option.effectProfile.worldTensionDelta > 4) {
      score -= 7;
    }
  }

  if (move.factionId === "faction-usa") {
    if (allianceConfidence < 55 && category === "diplomatic") {
      score += 8;
    }
    if (domesticPressure > 55 && category === "propaganda") {
      score += 6;
    }
    if (snapshot.escalationRisk >= 65 && category === "intelligence") {
      score += 7;
    }
  }

  if (move.factionId === "faction-ussr") {
    if (pressureWindow >= 60 && (category === "economic" || category === "military")) {
      score += 9;
    }
    if (commandConfidence < 55 && category === "diplomatic") {
      score += 6;
    }
    if (snapshot.escalationRisk >= 72 && category === "military") {
      score -= 10;
    }
  }

  if (move.factionId === "faction-anglo-french") {
    if (coalitionUnity >= 55 && usPressure < 55 && category === "military") {
      score += 10;
    }
    if (usPressure >= 60 && category === "diplomatic") {
      score += 8;
    }
    if (usPressure >= 65 && option.effectProfile.worldTensionDelta > 6) {
      score -= 8;
    }
  }

  if (move.factionId === "faction-egypt") {
    if (arabSupport >= 55 && (category === "propaganda" || category === "diplomatic")) {
      score += 8;
    }
    if (regimeCohesion < 50 && category === "military") {
      score -= 8;
    }
    if (snapshot.behind && category === "propaganda") {
      score += 5;
    }
  }

  return clampScore(score);
}

function buildHeuristicRationale(input: {
  move: BotMoveInput;
  option: BotMoveInput["game"]["state"]["privateByPlayer"][number]["availableOptions"][number];
}) {
  const snapshot = buildFactionStrategicSnapshot({
    scenario: input.move.scenario,
    game: input.move.game,
    factionId: input.move.factionId
  });
  const doctrineFit = describeOptionFitForDoctrine({
    option: input.option,
    doctrine: snapshot.doctrine
  });

  if (snapshot.escalationRisk >= 75 && input.option.effectProfile.worldTensionDelta <= 0) {
    return `Bot selected a controlled move because escalation pressure is already near the limit and ${snapshot.doctrine.doctrineLabel} now matters more than raw initiative${snapshot.doctrine.scenarioFocus ? ` in this ${snapshot.doctrine.scenarioFocus}` : ""}; the option ${doctrineFit}.`;
  }

  if (snapshot.behind) {
    return `Bot selected the option most likely to recover leverage and momentum before the round hardens while still following ${snapshot.doctrine.doctrineLabel}${snapshot.doctrine.scenarioFocus ? ` for ${snapshot.doctrine.scenarioFocus}` : ""}; it ${doctrineFit}.`;
  }

  return `Bot selected the option that best fits ${snapshot.doctrine.doctrineLabel}${snapshot.doctrine.scenarioFocus ? ` in this ${snapshot.doctrine.scenarioFocus}` : ""}; it ${doctrineFit}.`;
}

export class ProviderBackedBotStrategyService implements BotStrategyService {
  constructor(private readonly provider: BotDecisionProvider) {}

  async chooseAction(input: BotMoveInput): Promise<BotMoveDecision | null> {
    const privateState = input.game.state.privateByPlayer.find(
      (state) => state.factionId === input.factionId
    );
    const visibleOptions = privateState?.availableOptions ?? [];

    if (visibleOptions.length === 0) {
      return null;
    }

    const heuristicScores = new Map(
      visibleOptions.map((option) => [
        option.id,
        buildStrategicScore({
          move: input,
          option
        })
      ])
    );
    let providerDecision:
      | {
          optionId: string;
          rationale: string;
        }
      | null = null;

    try {
      const rawDecision = await this.provider.chooseBotDecision({
        game: input.game,
        scenario: input.scenario,
        factionId: input.factionId,
        visibleOptions,
        publicState: input.game.state.public
      });

      if (rawDecision !== null) {
        const decision = botDecisionPayloadSchema.parse(rawDecision);
        const optionIsVisible = visibleOptions.some(
          (candidate) => candidate.id === decision.optionId
        );

        if (!optionIsVisible) {
          throw new ValidationError(
            `Bot provider selected invalid option ${decision.optionId}.`
          );
        }

        providerDecision = {
          optionId: decision.optionId,
          rationale: decision.rationale
        };
      }
    } catch (error) {
      logWarn("Bot provider advisory ignored; using backend heuristic.", {
        gameId: input.game.id,
        turnNumber: input.game.turnNumber,
        factionId: input.factionId,
        reason: error instanceof Error ? error.message : "unknown"
      });
    }

    const rankedOptions = [...visibleOptions].sort((left, right) => {
      const leftScore =
        (heuristicScores.get(left.id) ?? 0) +
        (providerDecision?.optionId === left.id ? 4 : 0);
      const rightScore =
        (heuristicScores.get(right.id) ?? 0) +
        (providerDecision?.optionId === right.id ? 4 : 0);

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return left.id.localeCompare(right.id);
    });

    const selectedOption = rankedOptions[0];

    if (!selectedOption) {
      return null;
    }

    return {
      optionId: selectedOption.id,
      rationale:
        providerDecision?.optionId === selectedOption.id
          ? `${buildHeuristicRationale({
              move: input,
              option: selectedOption
            })} Provider note: ${providerDecision.rationale}`
          : buildHeuristicRationale({
              move: input,
              option: selectedOption
            })
    };
  }
}
