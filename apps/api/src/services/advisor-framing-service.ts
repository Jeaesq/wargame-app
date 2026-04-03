import type { ChoiceOption, Game } from "@wargame/shared";
import {
  describeOptionFitForDoctrine,
  getFactionDoctrineProfile,
  getStrategicCategory,
  type VisibleStrategicAssessment
} from "./faction-strategy-context.js";

export type VisibleAdvisorOptionComparison = {
  optionId: string;
  title: string;
  doctrineFit: "strong" | "situational" | "risky";
  pressureRole: "deescalate" | "hold_line" | "accelerate" | "probe";
  rationale: string;
  riskSummary: string;
};

export type VisibleAdvisorFraming = {
  roundLabel: string | null;
  pacingWindow: "opening" | "midgame" | "endgame";
  pacingSummary: string;
  pressureSummary: string;
  opponentSummary: string;
  optionComparisons: VisibleAdvisorOptionComparison[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getRoundLabel(game: Game) {
  if (game.mode === "solo" && game.progression.model === "solo_round") {
    return `Round ${game.progression.currentRound}`;
  }

  return `Turn ${game.turnNumber}`;
}

function getPacingWindow(maturityPercent: number): VisibleAdvisorFraming["pacingWindow"] {
  if (maturityPercent >= 70) {
    return "endgame";
  }

  if (maturityPercent >= 35) {
    return "midgame";
  }

  return "opening";
}

function getDoctrineFit(input: {
  option: ChoiceOption;
  assessment: VisibleStrategicAssessment | null;
}) {
  const category = getStrategicCategory(input.option);

  if (input.assessment?.preferredCategories.includes(category)) {
    return "strong" as const;
  }

  if (input.assessment?.cautiousCategories.includes(category)) {
    return "risky" as const;
  }

  return "situational" as const;
}

function getPressureRole(input: {
  option: ChoiceOption;
  assessment: VisibleStrategicAssessment | null;
  game: Game;
}) {
  const { worldTensionDelta, escalationRiskDelta } = input.option.effectProfile;
  const maturityPercent = input.game.state.derived.outcome.pressure.maturityPercent;

  if (worldTensionDelta <= 0 && escalationRiskDelta <= 0) {
    return "deescalate" as const;
  }

  if (
    getStrategicCategory(input.option) === "intelligence" ||
    (Math.abs(worldTensionDelta) <= 2 && Math.abs(escalationRiskDelta) <= 2 && maturityPercent < 50)
  ) {
    return "probe" as const;
  }

  if (
    maturityPercent >= 55 ||
    input.assessment?.strategicPosture === "recover" ||
    (input.option.recommendationPercent ?? 0) >= 65
  ) {
    return "accelerate" as const;
  }

  return "hold_line" as const;
}

function buildPacingSummary(input: {
  game: Game;
  assessment: VisibleStrategicAssessment | null;
}) {
  const pressure = input.game.state.derived.outcome.pressure;
  const roundLabel = getRoundLabel(input.game);
  const prefix = roundLabel ? `${roundLabel} is in the ${getPacingWindow(pressure.maturityPercent)} phase` : "The visible pacing window";

  if (pressure.deescalationOpportunityPercent >= 70) {
    return `${prefix}, and a visible off-ramp is open if you can keep pressure under control.`;
  }

  if (pressure.catastrophicRiskPercent >= 75) {
    return `${prefix}, and the crisis is close to a visible breaking point where a careless move could force the ending.`;
  }

  if (input.assessment?.strategicPosture === "recover") {
    return `${prefix}, so your side still needs to regain leverage before the round hardens against you.`;
  }

  if (input.assessment?.strategicPosture === "protect") {
    return `${prefix}, so the main task is to preserve your visible edge without opening unnecessary risk.`;
  }

  return `${prefix}, with room to improve leverage if the next move stays disciplined.`;
}

function buildPressureSummary(game: Game) {
  const pressure = game.state.derived.outcome.pressure;
  const escalation = game.state.derived.escalationRiskPercent;

  if (pressure.catastrophicRiskPercent >= 75 || escalation >= 75) {
    return `Visible pressure is severe: catastrophic risk is ${pressure.catastrophicRiskPercent}% and escalation risk is ${escalation}%.`;
  }

  if (pressure.deescalationOpportunityPercent >= 70) {
    return `Visible pressure favors restraint: de-escalation opportunity is ${pressure.deescalationOpportunityPercent}% while catastrophic risk is ${pressure.catastrophicRiskPercent}%.`;
  }

  return `Visible pressure is contested: decisive pressure is ${pressure.decisiveOutcomePercent}% and de-escalation opportunity is ${pressure.deescalationOpportunityPercent}%.`;
}

function buildOpponentSummary(assessment: VisibleStrategicAssessment | null) {
  if (!assessment) {
    return "No likely opposing posture can be inferred from the current visible state.";
  }

  return `Likely opponent posture points toward ${assessment.doctrineLabel}, with priority on ${assessment.visiblePriority.toLowerCase()}`;
}

function buildOptionComparison(input: {
  option: ChoiceOption;
  game: Game;
  factionId: string | null;
  assessment: VisibleStrategicAssessment | null;
}) {
  const faction = input.factionId
    ? input.game.factions.find((candidate) => candidate.id === input.factionId) ?? null
    : null;
  const doctrine = input.factionId
    ? getFactionDoctrineProfile({
        game: input.game,
        factionId: input.factionId
      })
    : {
        doctrineLabel: faction?.doctrineSummary ?? "visible priorities",
        preferredCategories: [] as string[],
        cautiousCategories: [] as string[],
        categoryBiases: {},
        pressureBias: 0,
        restraintBias: 0,
        initiativeBias: 0,
        scenarioFocus: null
      };
  const doctrineFit = getDoctrineFit({
    option: input.option,
    assessment: input.assessment
  });
  const pressureRole = getPressureRole({
    option: input.option,
    assessment: input.assessment,
    game: input.game
  });
  const fitPhrase =
    doctrineFit === "strong"
      ? "fits the current doctrine well"
      : doctrineFit === "risky"
        ? "pushes beyond the doctrine's safer lane"
        : "is more situational than doctrinal";
  const rolePhrase =
    pressureRole === "deescalate"
      ? "it visibly lowers pressure"
      : pressureRole === "accelerate"
        ? "it pushes the round toward a sharper outcome"
        : pressureRole === "probe"
          ? "it tests the situation without fully committing the round"
          : "it sustains pressure without forcing an immediate rupture";
  const riskSummary =
    doctrineFit === "risky"
      ? "Visible downside: this choice sits in a category your doctrine treats cautiously."
      : input.option.effectProfile.worldTensionDelta > 0 || input.option.effectProfile.escalationRiskDelta > 0
        ? "Visible downside: this choice adds pressure and could narrow later off-ramps."
        : "Visible downside: this choice may preserve flexibility but give up short-term initiative.";

  return {
    optionId: input.option.id,
    title: input.option.title,
    doctrineFit,
    pressureRole,
    rationale: `${input.option.title} ${fitPhrase} because it ${describeOptionFitForDoctrine({
      option: input.option,
      doctrine
    })}, and ${rolePhrase}.`,
    riskSummary
  };
}

function compareOptionComparisons(
  left: VisibleAdvisorOptionComparison,
  right: VisibleAdvisorOptionComparison
) {
  const fitScore = (comparison: VisibleAdvisorOptionComparison) =>
    comparison.doctrineFit === "strong" ? 3 : comparison.doctrineFit === "situational" ? 1 : -2;
  const roleScore = (comparison: VisibleAdvisorOptionComparison) =>
    comparison.pressureRole === "deescalate"
      ? 2
      : comparison.pressureRole === "hold_line"
        ? 1
        : comparison.pressureRole === "probe"
          ? 0
          : -1;

  return fitScore(right) + roleScore(right) - (fitScore(left) + roleScore(left));
}

export function buildVisibleAdvisorFraming(input: {
  game: Game;
  factionId: string | null;
  strategicAssessment: VisibleStrategicAssessment | null;
  likelyOpponentAssessment: VisibleStrategicAssessment | null;
  visibleOptions: ChoiceOption[];
}): VisibleAdvisorFraming {
  const pressure = input.game.state.derived.outcome.pressure;
  const pacingWindow = getPacingWindow(pressure.maturityPercent);

  return {
    roundLabel: getRoundLabel(input.game),
    pacingWindow,
    pacingSummary: buildPacingSummary({
      game: input.game,
      assessment: input.strategicAssessment
    }),
    pressureSummary: buildPressureSummary(input.game),
    opponentSummary: buildOpponentSummary(input.likelyOpponentAssessment),
    optionComparisons: [...input.visibleOptions]
      .map((option) =>
        buildOptionComparison({
          option,
          game: input.game,
          factionId: input.factionId,
          assessment: input.strategicAssessment
        })
      )
      .sort(compareOptionComparisons)
      .map((comparison) => ({
        ...comparison,
        rationale: comparison.rationale,
        riskSummary: comparison.riskSummary
      }))
  };
}

export function scoreAdvisorComparison(input: {
  comparison: VisibleAdvisorOptionComparison;
  visibleOutcome: Game["state"]["derived"]["outcome"];
  recommendationPercent: number | null;
}) {
  let score = input.recommendationPercent ?? 50;

  if (input.comparison.doctrineFit === "strong") {
    score += 8;
  } else if (input.comparison.doctrineFit === "risky") {
    score -= 6;
  } else {
    score += 2;
  }

  if (
    input.visibleOutcome.pressure.catastrophicRiskPercent >= 70 &&
    input.comparison.pressureRole === "deescalate"
  ) {
    score += 8;
  } else if (
    input.visibleOutcome.pressure.deescalationOpportunityPercent >= 70 &&
    input.comparison.pressureRole === "deescalate"
  ) {
    score += 6;
  } else if (
    input.visibleOutcome.pressure.maturityPercent >= 55 &&
    input.comparison.pressureRole === "accelerate"
  ) {
    score += 3;
  } else if (input.comparison.pressureRole === "probe") {
    score += 1;
  }

  return clampScore(score);
}
