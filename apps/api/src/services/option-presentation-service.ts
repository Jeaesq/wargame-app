import type {
  ChoiceOption,
  DerivedGameState,
  PrivatePlayerState,
  PublicGameState,
  ScenarioDefinition,
  TargetGameLength
} from "@wargame/shared";
import { listLegalOptions } from "./legal-option-service.js";

type RecommendationNote = {
  optionId: string;
  rationale: string;
};

type BuildAvailableOptionsInput = {
  scenario: ScenarioDefinition;
  factionId: string | null;
  publicState: Pick<
    PublicGameState,
    "worldTension" | "visibleTracks" | "publicFlags" | "revealedEvents"
  >;
  privateState: Pick<
    PrivatePlayerState,
    "secretFlags" | "hiddenTracks" | "metadata"
  > | null;
  derivedState: Pick<
    DerivedGameState,
    "escalationRiskPercent" | "negotiationLeverage" | "factionMomentum" | "outcome"
  >;
  targetGameLength: TargetGameLength;
  currentRound: number;
  recommendationNotes?: RecommendationNote[];
  limit?: number;
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getPresentationCategory(option: ChoiceOption): string {
  switch (option.kind) {
    case "military_signal":
      return "military";
    case "intelligence":
      return "intelligence/covert";
    case "propaganda":
      return "domestic/political";
    case "economic":
      return "economic";
    case "special":
      return "special";
    default:
      return "diplomatic";
  }
}

function getPacingBias(targetGameLength: TargetGameLength): number {
  switch (targetGameLength) {
    case "short":
      return 6;
    case "long":
      return -2;
    default:
      return 2;
  }
}

function buildPrimaryUse(option: ChoiceOption, factionId: string): string {
  const leverageGain = option.effectProfile.negotiationLeverageDeltas[factionId] ?? 0;
  const momentumGain = option.effectProfile.factionMomentumDeltas[factionId] ?? 0;

  if (option.effectProfile.worldTensionDelta <= -4 || option.effectProfile.escalationRiskDelta <= -4) {
    return "opening a controlled off-ramp";
  }

  if (leverageGain >= 5) {
    return "improving negotiating leverage";
  }

  if (momentumGain >= 5) {
    return "regaining political initiative";
  }

  switch (getPresentationCategory(option)) {
    case "military":
      return "testing resolve with a hard signal";
    case "intelligence/covert":
      return "probing quietly for hidden advantage";
    case "domestic/political":
      return "shaping domestic and allied opinion";
    case "economic":
      return "raising pressure through non-military friction";
    default:
      return "signaling diplomatic intent";
  }
}

function buildTradeoff(option: ChoiceOption): string {
  if (option.effectProfile.worldTensionDelta >= 8 || option.effectProfile.escalationRiskDelta >= 8) {
    return "It sharply raises escalation danger.";
  }

  if (option.effectProfile.worldTensionDelta >= 4 || option.effectProfile.escalationRiskDelta >= 4) {
    return "It adds visible pressure and scrutiny.";
  }

  if (option.effectProfile.worldTensionDelta <= -4 || option.effectProfile.escalationRiskDelta <= -4) {
    return "It may ease pressure, but can also soften your visible leverage.";
  }

  return "Its gains are incremental rather than decisive.";
}

function buildWhyNow(input: {
  option: ChoiceOption;
  factionId: string;
  worldTension: number;
  escalationRiskPercent: number;
  outcome: DerivedGameState["outcome"];
}): string {
  const progress = input.outcome.publicObjectiveProgress[input.factionId] ?? 50;
  const rivalProgress = Math.max(
    ...Object.entries(input.outcome.publicObjectiveProgress)
      .filter(([key]) => key !== input.factionId)
      .map(([, value]) => value),
    50
  );
  const behind = progress + 5 < rivalProgress;
  const late = input.outcome.pressure.maturityPercent >= 60;

  if (
    input.escalationRiskPercent >= 70 &&
    (input.option.effectProfile.worldTensionDelta <= 0 ||
      input.option.effectProfile.escalationRiskDelta <= 0)
  ) {
    return "Current escalation pressure rewards a controlled move.";
  }

  if (behind && late) {
    return "You need meaningful movement before the crisis hardens.";
  }

  if (late && input.option.effectProfile.negotiationLeverageDeltas[input.factionId] > 0) {
    return "Late-stage turns now favor options that change the bargaining position.";
  }

  if (input.worldTension <= 50 && getPresentationCategory(input.option) === "military") {
    return "There is still some room to signal resolve before the crisis fully locks up.";
  }

  return "It fits the current balance of pressure, leverage, and timing.";
}

function scoreOption(input: {
  option: ChoiceOption;
  factionId: string;
  publicState: BuildAvailableOptionsInput["publicState"];
  derivedState: BuildAvailableOptionsInput["derivedState"];
  targetGameLength: TargetGameLength;
}): number {
  const { option, factionId, publicState, derivedState, targetGameLength } = input;
  const base = option.recommendationPercent ?? 50;
  const leverageGain = option.effectProfile.negotiationLeverageDeltas[factionId] ?? 0;
  const momentumGain = option.effectProfile.factionMomentumDeltas[factionId] ?? 0;
  const risk = derivedState.escalationRiskPercent;
  const outcome = derivedState.outcome;
  const progress = outcome.publicObjectiveProgress[factionId] ?? 50;
  const rivalProgress = Math.max(
    ...Object.entries(outcome.publicObjectiveProgress)
      .filter(([key]) => key !== factionId)
      .map(([, value]) => value),
    50
  );
  const behind = progress + 5 < rivalProgress;
  const highRisk = risk >= 70 || outcome.pressure.catastrophicRiskPercent >= 72;
  const late = outcome.pressure.maturityPercent >= 60;
  const needsDecisiveMove = late && outcome.pressure.decisiveOutcomePercent < 60;
  const category = getPresentationCategory(option);

  let score = base + getPacingBias(targetGameLength);

  if (highRisk) {
    if (option.effectProfile.worldTensionDelta <= 0 || option.effectProfile.escalationRiskDelta <= 0) {
      score += 15;
    }
    if (category === "military") {
      score -= 14;
    }
  }

  if (outcome.pressure.deescalationOpportunityPercent >= 60) {
    if (option.effectProfile.worldTensionDelta <= -2) {
      score += 8;
    }
  }

  if (needsDecisiveMove) {
    score += leverageGain * 1.4 + momentumGain * 1.1;
  }

  if (behind) {
    score += leverageGain + momentumGain;
    if (!highRisk && category === "military") {
      score += 5;
    }
  } else if (highRisk && option.effectProfile.worldTensionDelta > 0) {
    score -= 6;
  }

  if (category === "intelligence/covert" && publicState.worldTension >= 60) {
    score += 5;
  }

  if (category === "domestic/political" && publicState.visibleTracks.globalAttention >= 60) {
    score += 5;
  }

  if (category === "economic" && publicState.visibleTracks.diplomaticPressure >= 55) {
    score += 4;
  }

  return score;
}

function buildOptionDetail(input: {
  option: ChoiceOption;
  factionId: string;
  publicState: BuildAvailableOptionsInput["publicState"];
  derivedState: BuildAvailableOptionsInput["derivedState"];
  recommendationNote?: string;
}): string {
  const primaryUse = buildPrimaryUse(input.option, input.factionId);
  const tradeoff = buildTradeoff(input.option);
  const whyNow = buildWhyNow({
    option: input.option,
    factionId: input.factionId,
    worldTension: input.publicState.worldTension,
    escalationRiskPercent: input.derivedState.escalationRiskPercent,
    outcome: input.derivedState.outcome
  });
  const analystNote = input.recommendationNote
    ? ` Analyst view: ${input.recommendationNote}`
    : "";

  return `Best for ${primaryUse}. ${tradeoff} Why now: ${whyNow}${analystNote}`;
}

export function buildAvailableOptions(input: BuildAvailableOptionsInput): ChoiceOption[] {
  if (!input.factionId) {
    return [];
  }

  const recommendationNotes = new Map(
    (input.recommendationNotes ?? []).map((note) => [note.optionId, note.rationale])
  );
  const legalOptions = listLegalOptions({
    scenario: input.scenario,
    factionId: input.factionId,
    publicState: input.publicState,
    privateState: input.privateState,
    currentRound: input.currentRound
  });
  const candidates = legalOptions
    .map((option) => {
      const score = scoreOption({
        option,
        factionId: input.factionId!,
        publicState: input.publicState,
        derivedState: input.derivedState,
        targetGameLength: input.targetGameLength
      });
      const detail = buildOptionDetail({
        option,
        factionId: input.factionId!,
        publicState: input.publicState,
        derivedState: input.derivedState,
        recommendationNote: recommendationNotes.get(option.id)
      });

      return {
        ...option,
        detail,
        recommendationPercent: clampPercent((option.recommendationPercent ?? 50) + (score - (option.recommendationPercent ?? 50)) * 0.45),
        metadata: {
          ...option.metadata,
          presentationCategory: getPresentationCategory(option),
          strategicScore: clampPercent(score)
        }
      };
    });

  const sorted = [...candidates].sort((left, right) => {
    const leftScore = Number(left.metadata.strategicScore ?? 0);
    const rightScore = Number(right.metadata.strategicScore ?? 0);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return (right.recommendationPercent ?? 0) - (left.recommendationPercent ?? 0);
  });

  const limit = input.limit ?? 4;
  const selected: ChoiceOption[] = [];
  const seenCategories = new Set<string>();

  for (const option of sorted) {
    const category = String(option.metadata.presentationCategory ?? getPresentationCategory(option));

    if (!seenCategories.has(category)) {
      selected.push(option);
      seenCategories.add(category);
    }

    if (selected.length >= limit) {
      break;
    }
  }

  if (selected.length < Math.min(limit, sorted.length)) {
    for (const option of sorted) {
      if (!selected.some((candidate) => candidate.id === option.id)) {
        selected.push(option);
      }

      if (selected.length >= limit) {
        break;
      }
    }
  }

  return selected;
}
