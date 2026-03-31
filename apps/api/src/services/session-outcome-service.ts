import {
  sessionOutcomeSchema,
  type ChoiceOption,
  type ScenarioDefinition,
  type SessionOutcome,
  type TargetGameLength
} from "@wargame/shared";

type EvaluateSessionOutcomeInput = {
  scenario: ScenarioDefinition;
  targetGameLength: TargetGameLength;
  turnNumber: number;
  worldTension: number;
  escalationRiskPercent: number;
  visibleTracks: Record<string, number>;
  negotiationLeverage: Record<string, number>;
  factionMomentum: Record<string, number>;
  selectedOption: ChoiceOption;
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getGuidanceTurns(targetGameLength: TargetGameLength): number {
  switch (targetGameLength) {
    case "short":
      return 5;
    case "long":
      return 9;
    default:
      return 7;
  }
}

function scoreObjectiveProgress(input: {
  factionId: string;
  worldTension: number;
  visibleTracks: Record<string, number>;
  negotiationLeverage: Record<string, number>;
  factionMomentum: Record<string, number>;
}) {
  const leverage = input.negotiationLeverage[input.factionId] ?? 50;
  const momentum = input.factionMomentum[input.factionId] ?? 50;
  const diplomaticPressure = input.visibleTracks.diplomaticPressure ?? 50;
  const militaryPosture = input.visibleTracks.militaryPosture ?? 50;
  const globalAttention = input.visibleTracks.globalAttention ?? 50;

  if (input.factionId === "faction-usa") {
    return clampPercent(
      leverage * 0.36 +
        momentum * 0.3 +
        (100 - input.worldTension) * 0.2 +
        globalAttention * 0.08 +
        (100 - militaryPosture) * 0.06
    );
  }

  if (input.factionId === "faction-ussr") {
    return clampPercent(
      leverage * 0.31 +
        momentum * 0.31 +
        diplomaticPressure * 0.22 +
        militaryPosture * 0.1 +
        input.worldTension * 0.06
    );
  }

  return clampPercent(leverage * 0.5 + momentum * 0.5);
}

function buildOutcomeTitle(category: NonNullable<SessionOutcome["category"]>, winnerName?: string) {
  switch (category) {
    case "strategic_success":
      return winnerName ? `${winnerName} secures strategic success` : "Strategic success";
    case "partial_success":
      return winnerName ? `${winnerName} claims a partial success` : "Partial success";
    case "stalemate":
      return "The crisis settles into stalemate";
    case "crisis_deescalation":
      return "The crisis begins to de-escalate";
    case "catastrophic_escalation":
      return "The crisis spirals into catastrophic escalation";
  }
}

function buildOutcomeSummary(input: {
  category: NonNullable<SessionOutcome["category"]>;
  winnerName?: string;
  worldTension: number;
  escalationRiskPercent: number;
}) {
  switch (input.category) {
    case "strategic_success":
      return `${input.winnerName ?? "One faction"} converted sustained leverage into a decisive political advantage before the confrontation tipped into open war.`;
    case "partial_success":
      return `${input.winnerName ?? "One faction"} emerged ahead on balance, but the crisis still extracted meaningful costs and left unresolved risks behind.`;
    case "stalemate":
      return "Neither bloc could force a favorable settlement, and the confrontation hardened into an uneasy but durable impasse.";
    case "crisis_deescalation":
      return `Tension eased to ${input.worldTension}% with escalation risk at ${input.escalationRiskPercent}%, creating a credible off-ramp without fully settling the rivalry.`;
    case "catastrophic_escalation":
      return `World tension reached ${input.worldTension}% and escalation risk climbed to ${input.escalationRiskPercent}%, overwhelming attempts to manage the crisis.`;
  }
}

export function evaluateSessionOutcome(
  input: EvaluateSessionOutcomeInput
): SessionOutcome {
  const guidanceTurns = getGuidanceTurns(input.targetGameLength);
  const maturityPercent = clampPercent(((input.turnNumber - 1) / guidanceTurns) * 100);
  const publicObjectiveProgress = Object.fromEntries(
    input.scenario.factions.map((faction) => [
      faction.id,
      scoreObjectiveProgress({
        factionId: faction.id,
        worldTension: input.worldTension,
        visibleTracks: input.visibleTracks,
        negotiationLeverage: input.negotiationLeverage,
        factionMomentum: input.factionMomentum
      })
    ])
  );
  const usaProgress = publicObjectiveProgress["faction-usa"] ?? 50;
  const ussrProgress = publicObjectiveProgress["faction-ussr"] ?? 50;
  const lead = Math.abs(usaProgress - ussrProgress);
  const decisiveOutcomePercent = clampPercent(
    lead * 4 + Math.max(usaProgress, ussrProgress) * 0.4 + maturityPercent * 0.3
  );
  const deescalationOpportunityPercent = clampPercent(
    (100 - input.worldTension) * 0.38 +
      (100 - input.escalationRiskPercent) * 0.37 +
      (input.negotiationLeverage["faction-usa"] ?? 50) * 0.13 +
      (input.negotiationLeverage["faction-ussr"] ?? 50) * 0.12
  );
  const catastrophicRiskPercent = clampPercent(
    input.worldTension * 0.54 +
      input.escalationRiskPercent * 0.36 +
      (input.visibleTracks.militaryPosture ?? 50) * 0.1
  );

  const pressure = {
    maturityPercent,
    decisiveOutcomePercent,
    deescalationOpportunityPercent,
    catastrophicRiskPercent
  };

  const leaderFactionId = usaProgress >= ussrProgress ? "faction-usa" : "faction-ussr";
  const leaderProgress = Math.max(usaProgress, ussrProgress);
  const winnerName =
    input.scenario.factions.find((faction) => faction.id === leaderFactionId)?.name;
  const strategicThreshold = Math.max(74, 86 - Math.floor(maturityPercent / 12));
  const strategicLeadThreshold = Math.max(8, 18 - Math.floor(maturityPercent / 14));
  const partialThreshold = Math.max(63, 74 - Math.floor(maturityPercent / 12));
  const partialLeadThreshold = Math.max(4, 11 - Math.floor(maturityPercent / 18));

  let category: SessionOutcome["category"] = null;
  let winningFactionId: string | null = null;

  if (
    catastrophicRiskPercent >= Math.max(78, 94 - Math.floor(maturityPercent / 8)) &&
    maturityPercent >= 25
  ) {
    category = "catastrophic_escalation";
  } else if (
    deescalationOpportunityPercent >= Math.max(70, 86 - Math.floor(maturityPercent / 10)) &&
    input.worldTension <= 45 &&
    input.escalationRiskPercent <= 45 &&
    maturityPercent >= 25
  ) {
    category = "crisis_deescalation";
  } else if (
    leaderProgress >= strategicThreshold &&
    lead >= strategicLeadThreshold &&
    maturityPercent >= 35
  ) {
    category = "strategic_success";
    winningFactionId = leaderFactionId;
  } else if (
    leaderProgress >= partialThreshold &&
    lead >= partialLeadThreshold &&
    maturityPercent >= 28 &&
    decisiveOutcomePercent >= 55
  ) {
    category = "partial_success";
    winningFactionId = leaderFactionId;
  } else if (
    maturityPercent >= 82 &&
    lead <= 6 &&
    catastrophicRiskPercent < 82
  ) {
    category = "stalemate";
  }

  return sessionOutcomeSchema.parse({
    status: category ? "ended" : "ongoing",
    category,
    title: category ? buildOutcomeTitle(category, winnerName) : null,
    summary: category
      ? buildOutcomeSummary({
          category,
          winnerName,
          worldTension: input.worldTension,
          escalationRiskPercent: input.escalationRiskPercent
        })
      : null,
    winningFactionId,
    achievedAtTurn: category ? input.turnNumber : null,
    pressure,
    publicObjectiveProgress,
    metadata: {
      selectedOptionId: input.selectedOption.id,
      selectedOptionKind: input.selectedOption.kind
    }
  });
}
