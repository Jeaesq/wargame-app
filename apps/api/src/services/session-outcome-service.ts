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
  publicFlags?: string[];
  revealedEvents?: string[];
  negotiationLeverage: Record<string, number>;
  factionMomentum: Record<string, number>;
  selectedOption: ChoiceOption;
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

type FactionProgressModel = {
  leverageWeight: number;
  momentumWeight: number;
  worldTensionWeight: number;
  escalationRiskWeight: number;
  visibleTrackWeights: Record<string, number>;
  base: number;
};

type ParsedOutcomeModel = {
  guidanceRoundsByLength: Record<TargetGameLength, number>;
  factionProgressModels: Record<string, FactionProgressModel>;
  conditionModifiers: ParsedOutcomeConditionModifier[];
  decisiveLeadWeight: number;
  decisiveLeaderWeight: number;
  decisiveMaturityWeight: number;
  deescalationWorldTensionWeight: number;
  deescalationEscalationWeight: number;
  deescalationNegotiationWeight: number;
  deescalationTrackWeights: Record<string, number>;
  catastrophicWorldTensionWeight: number;
  catastrophicEscalationWeight: number;
  catastrophicTrackWeights: Record<string, number>;
  strategicThresholdBase: number;
  strategicThresholdFloor: number;
  strategicThresholdMaturityDivisor: number;
  strategicLeadBase: number;
  strategicLeadFloor: number;
  strategicLeadMaturityDivisor: number;
  partialThresholdBase: number;
  partialThresholdFloor: number;
  partialThresholdMaturityDivisor: number;
  partialLeadBase: number;
  partialLeadFloor: number;
  partialLeadMaturityDivisor: number;
  catastrophicBaseThreshold: number;
  catastrophicMaturityDivisor: number;
  deescalationBaseThreshold: number;
  deescalationMaturityDivisor: number;
  minResolutionMaturityPercent: number;
  stalemateMaturityThreshold: number;
  stalemateLeadThreshold: number;
};

type ParsedOutcomeConditionModifier = {
  requiredPublicFlags: string[];
  absentPublicFlags: string[];
  requiredRevealedEvents: string[];
  absentRevealedEvents: string[];
  factionProgressBonuses: Record<string, number>;
  deescalationBonus: number;
  catastrophicBonus: number;
  decisiveBonus: number;
};

function isNumberRecord(value: unknown): value is Record<string, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "number")
  );
}

function parseFactionProgressModel(value: unknown): FactionProgressModel | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    leverageWeight: typeof record.leverageWeight === "number" ? record.leverageWeight : 0.4,
    momentumWeight: typeof record.momentumWeight === "number" ? record.momentumWeight : 0.35,
    worldTensionWeight:
      typeof record.worldTensionWeight === "number" ? record.worldTensionWeight : 0,
    escalationRiskWeight:
      typeof record.escalationRiskWeight === "number" ? record.escalationRiskWeight : 0,
    visibleTrackWeights: isNumberRecord(record.visibleTrackWeights)
      ? record.visibleTrackWeights
      : {},
    base: typeof record.base === "number" ? record.base : 0
  };
}

function parseOutcomeConditionModifier(
  value: unknown
): ParsedOutcomeConditionModifier | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  return {
    requiredPublicFlags: Array.isArray(record.requiredPublicFlags)
      ? record.requiredPublicFlags.filter((entry): entry is string => typeof entry === "string")
      : [],
    absentPublicFlags: Array.isArray(record.absentPublicFlags)
      ? record.absentPublicFlags.filter((entry): entry is string => typeof entry === "string")
      : [],
    requiredRevealedEvents: Array.isArray(record.requiredRevealedEvents)
      ? record.requiredRevealedEvents.filter((entry): entry is string => typeof entry === "string")
      : [],
    absentRevealedEvents: Array.isArray(record.absentRevealedEvents)
      ? record.absentRevealedEvents.filter((entry): entry is string => typeof entry === "string")
      : [],
    factionProgressBonuses: isNumberRecord(record.factionProgressBonuses)
      ? record.factionProgressBonuses
      : {},
    deescalationBonus:
      typeof record.deescalationBonus === "number" ? record.deescalationBonus : 0,
    catastrophicBonus:
      typeof record.catastrophicBonus === "number" ? record.catastrophicBonus : 0,
    decisiveBonus: typeof record.decisiveBonus === "number" ? record.decisiveBonus : 0
  };
}

function getOutcomeModel(scenario: ScenarioDefinition): ParsedOutcomeModel {
  const candidate =
    typeof scenario.metadata?.outcomeModel === "object" &&
    scenario.metadata.outcomeModel !== null &&
    !Array.isArray(scenario.metadata.outcomeModel)
      ? (scenario.metadata.outcomeModel as Record<string, unknown>)
      : {};
  const guidanceCandidate =
    typeof candidate.guidanceRoundsByLength === "object" &&
    candidate.guidanceRoundsByLength !== null &&
    !Array.isArray(candidate.guidanceRoundsByLength)
      ? (candidate.guidanceRoundsByLength as Record<string, unknown>)
      : {};
  const factionModelsCandidate =
    typeof candidate.factionProgressModels === "object" &&
    candidate.factionProgressModels !== null &&
    !Array.isArray(candidate.factionProgressModels)
      ? (candidate.factionProgressModels as Record<string, unknown>)
      : {};
  const conditionModifiersCandidate = Array.isArray(candidate.conditionModifiers)
    ? candidate.conditionModifiers
    : [];

  return {
    guidanceRoundsByLength: {
      short: typeof guidanceCandidate.short === "number" ? guidanceCandidate.short : 5,
      medium: typeof guidanceCandidate.medium === "number" ? guidanceCandidate.medium : 7,
      long: typeof guidanceCandidate.long === "number" ? guidanceCandidate.long : 9
    },
    factionProgressModels: Object.fromEntries(
      scenario.factions.map((faction) => [
        faction.id,
        parseFactionProgressModel(factionModelsCandidate[faction.id]) ?? {
          leverageWeight: 0.4,
          momentumWeight: 0.35,
          worldTensionWeight: 0,
          escalationRiskWeight: 0,
          visibleTrackWeights: {},
          base: 0
        }
      ])
    ),
    conditionModifiers: conditionModifiersCandidate.flatMap((modifier) => {
      const parsedModifier = parseOutcomeConditionModifier(modifier);
      return parsedModifier ? [parsedModifier] : [];
    }),
    decisiveLeadWeight:
      typeof candidate.decisiveLeadWeight === "number" ? candidate.decisiveLeadWeight : 4,
    decisiveLeaderWeight:
      typeof candidate.decisiveLeaderWeight === "number"
        ? candidate.decisiveLeaderWeight
        : 0.4,
    decisiveMaturityWeight:
      typeof candidate.decisiveMaturityWeight === "number"
        ? candidate.decisiveMaturityWeight
        : 0.3,
    deescalationWorldTensionWeight:
      typeof candidate.deescalationWorldTensionWeight === "number"
        ? candidate.deescalationWorldTensionWeight
        : 0.38,
    deescalationEscalationWeight:
      typeof candidate.deescalationEscalationWeight === "number"
        ? candidate.deescalationEscalationWeight
        : 0.37,
    deescalationNegotiationWeight:
      typeof candidate.deescalationNegotiationWeight === "number"
        ? candidate.deescalationNegotiationWeight
        : 0.25,
    deescalationTrackWeights: isNumberRecord(candidate.deescalationTrackWeights)
      ? candidate.deescalationTrackWeights
      : {},
    catastrophicWorldTensionWeight:
      typeof candidate.catastrophicWorldTensionWeight === "number"
        ? candidate.catastrophicWorldTensionWeight
        : 0.54,
    catastrophicEscalationWeight:
      typeof candidate.catastrophicEscalationWeight === "number"
        ? candidate.catastrophicEscalationWeight
        : 0.36,
    catastrophicTrackWeights: isNumberRecord(candidate.catastrophicTrackWeights)
      ? candidate.catastrophicTrackWeights
      : {},
    strategicThresholdBase:
      typeof candidate.strategicThresholdBase === "number"
        ? candidate.strategicThresholdBase
        : 86,
    strategicThresholdFloor:
      typeof candidate.strategicThresholdFloor === "number"
        ? candidate.strategicThresholdFloor
        : 74,
    strategicThresholdMaturityDivisor:
      typeof candidate.strategicThresholdMaturityDivisor === "number"
        ? candidate.strategicThresholdMaturityDivisor
        : 12,
    strategicLeadBase:
      typeof candidate.strategicLeadBase === "number" ? candidate.strategicLeadBase : 18,
    strategicLeadFloor:
      typeof candidate.strategicLeadFloor === "number" ? candidate.strategicLeadFloor : 8,
    strategicLeadMaturityDivisor:
      typeof candidate.strategicLeadMaturityDivisor === "number"
        ? candidate.strategicLeadMaturityDivisor
        : 14,
    partialThresholdBase:
      typeof candidate.partialThresholdBase === "number"
        ? candidate.partialThresholdBase
        : 74,
    partialThresholdFloor:
      typeof candidate.partialThresholdFloor === "number"
        ? candidate.partialThresholdFloor
        : 63,
    partialThresholdMaturityDivisor:
      typeof candidate.partialThresholdMaturityDivisor === "number"
        ? candidate.partialThresholdMaturityDivisor
        : 12,
    partialLeadBase:
      typeof candidate.partialLeadBase === "number" ? candidate.partialLeadBase : 11,
    partialLeadFloor:
      typeof candidate.partialLeadFloor === "number" ? candidate.partialLeadFloor : 4,
    partialLeadMaturityDivisor:
      typeof candidate.partialLeadMaturityDivisor === "number"
        ? candidate.partialLeadMaturityDivisor
        : 18,
    catastrophicBaseThreshold:
      typeof candidate.catastrophicBaseThreshold === "number"
        ? candidate.catastrophicBaseThreshold
        : 94,
    catastrophicMaturityDivisor:
      typeof candidate.catastrophicMaturityDivisor === "number"
        ? candidate.catastrophicMaturityDivisor
        : 8,
    deescalationBaseThreshold:
      typeof candidate.deescalationBaseThreshold === "number"
        ? candidate.deescalationBaseThreshold
        : 86,
    deescalationMaturityDivisor:
      typeof candidate.deescalationMaturityDivisor === "number"
        ? candidate.deescalationMaturityDivisor
        : 10,
    minResolutionMaturityPercent:
      typeof candidate.minResolutionMaturityPercent === "number"
        ? candidate.minResolutionMaturityPercent
        : 25,
    stalemateMaturityThreshold:
      typeof candidate.stalemateMaturityThreshold === "number"
        ? candidate.stalemateMaturityThreshold
        : 82,
    stalemateLeadThreshold:
      typeof candidate.stalemateLeadThreshold === "number"
        ? candidate.stalemateLeadThreshold
        : 6
  };
}

function getGuidanceTurns(
  targetGameLength: TargetGameLength,
  outcomeModel: ParsedOutcomeModel
): number {
  return outcomeModel.guidanceRoundsByLength[targetGameLength];
}

function scoreObjectiveProgress(input: {
  factionId: string;
  worldTension: number;
  escalationRiskPercent: number;
  visibleTracks: Record<string, number>;
  negotiationLeverage: Record<string, number>;
  factionMomentum: Record<string, number>;
  outcomeModel: ParsedOutcomeModel;
}) {
  const model = input.outcomeModel.factionProgressModels[input.factionId];
  const leverage = input.negotiationLeverage[input.factionId] ?? 50;
  const momentum = input.factionMomentum[input.factionId] ?? 50;
  const trackScore = Object.entries(model.visibleTrackWeights).reduce(
    (total, [track, weight]) => total + (input.visibleTracks[track] ?? 50) * weight,
    0
  );

  return clampPercent(
    model.base +
      leverage * model.leverageWeight +
      momentum * model.momentumWeight +
      input.worldTension * model.worldTensionWeight +
      input.escalationRiskPercent * model.escalationRiskWeight +
      trackScore
  );
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

function getActiveOutcomeModifierTotals(input: {
  modifiers: ParsedOutcomeConditionModifier[];
  publicFlags: string[];
  revealedEvents: string[];
  factionIds: string[];
}) {
  const publicFlagSet = new Set(input.publicFlags);
  const revealedEventSet = new Set(input.revealedEvents);

  return input.modifiers.reduce(
    (totals, modifier) => {
      const matches =
        modifier.requiredPublicFlags.every((flag) => publicFlagSet.has(flag)) &&
        modifier.absentPublicFlags.every((flag) => !publicFlagSet.has(flag)) &&
        modifier.requiredRevealedEvents.every((eventId) => revealedEventSet.has(eventId)) &&
        modifier.absentRevealedEvents.every((eventId) => !revealedEventSet.has(eventId));

      if (!matches) {
        return totals;
      }

      return {
        factionProgressBonuses: Object.fromEntries(
          input.factionIds.map((factionId) => [
            factionId,
            (totals.factionProgressBonuses[factionId] ?? 0) +
              (modifier.factionProgressBonuses[factionId] ?? 0)
          ])
        ),
        deescalationBonus: totals.deescalationBonus + modifier.deescalationBonus,
        catastrophicBonus: totals.catastrophicBonus + modifier.catastrophicBonus,
        decisiveBonus: totals.decisiveBonus + modifier.decisiveBonus
      };
    },
    {
      factionProgressBonuses: Object.fromEntries(
        input.factionIds.map((factionId) => [factionId, 0])
      ) as Record<string, number>,
      deescalationBonus: 0,
      catastrophicBonus: 0,
      decisiveBonus: 0
    }
  );
}

export function evaluateSessionOutcome(
  input: EvaluateSessionOutcomeInput
): SessionOutcome {
  const outcomeModel = getOutcomeModel(input.scenario);
  const guidanceTurns = getGuidanceTurns(input.targetGameLength, outcomeModel);
  const maturityPercent = clampPercent(((input.turnNumber - 1) / guidanceTurns) * 100);
  const activeModifierTotals = getActiveOutcomeModifierTotals({
    modifiers: outcomeModel.conditionModifiers,
    publicFlags: input.publicFlags ?? [],
    revealedEvents: input.revealedEvents ?? [],
    factionIds: input.scenario.factions.map((faction) => faction.id)
  });
  const publicObjectiveProgress = Object.fromEntries(
    input.scenario.factions.map((faction) => [
      faction.id,
      clampPercent(
        scoreObjectiveProgress({
          factionId: faction.id,
          worldTension: input.worldTension,
          escalationRiskPercent: input.escalationRiskPercent,
          visibleTracks: input.visibleTracks,
          negotiationLeverage: input.negotiationLeverage,
          factionMomentum: input.factionMomentum,
          outcomeModel
        }) + (activeModifierTotals.factionProgressBonuses[faction.id] ?? 0)
      )
    ])
  );
  const rankedProgress = Object.entries(publicObjectiveProgress).sort(
    (left, right) => right[1] - left[1]
  );
  const leaderFactionId = rankedProgress[0]?.[0] ?? input.scenario.factions[0]?.id ?? null;
  const leaderProgress = rankedProgress[0]?.[1] ?? 50;
  const runnerUpProgress = rankedProgress[1]?.[1] ?? 50;
  const lead = Math.abs(leaderProgress - runnerUpProgress);
  const decisiveOutcomePercent = clampPercent(
    lead * outcomeModel.decisiveLeadWeight +
      leaderProgress * outcomeModel.decisiveLeaderWeight +
      maturityPercent * outcomeModel.decisiveMaturityWeight +
      activeModifierTotals.decisiveBonus
  );
  const averageNegotiationLeverage =
    Object.values(input.negotiationLeverage).length > 0
      ? Object.values(input.negotiationLeverage).reduce((sum, value) => sum + value, 0) /
        Object.values(input.negotiationLeverage).length
      : 50;
  const deescalationOpportunityPercent = clampPercent(
    (100 - input.worldTension) * outcomeModel.deescalationWorldTensionWeight +
      (100 - input.escalationRiskPercent) * outcomeModel.deescalationEscalationWeight +
      averageNegotiationLeverage * outcomeModel.deescalationNegotiationWeight +
      Object.entries(outcomeModel.deescalationTrackWeights).reduce(
        (sum, [track, weight]) => sum + (input.visibleTracks[track] ?? 50) * weight,
        0
      ) +
      activeModifierTotals.deescalationBonus
  );
  const catastrophicRiskPercent = clampPercent(
    input.worldTension * outcomeModel.catastrophicWorldTensionWeight +
      input.escalationRiskPercent * outcomeModel.catastrophicEscalationWeight +
      Object.entries(outcomeModel.catastrophicTrackWeights).reduce(
        (sum, [track, weight]) => sum + (input.visibleTracks[track] ?? 50) * weight,
        0
      ) +
      activeModifierTotals.catastrophicBonus
  );

  const pressure = {
    maturityPercent,
    decisiveOutcomePercent,
    deescalationOpportunityPercent,
    catastrophicRiskPercent
  };

  const winnerName =
    input.scenario.factions.find((faction) => faction.id === leaderFactionId)?.name;
  const strategicThreshold = Math.max(
    outcomeModel.strategicThresholdFloor,
    outcomeModel.strategicThresholdBase -
      Math.floor(maturityPercent / outcomeModel.strategicThresholdMaturityDivisor)
  );
  const strategicLeadThreshold = Math.max(
    outcomeModel.strategicLeadFloor,
    outcomeModel.strategicLeadBase -
      Math.floor(maturityPercent / outcomeModel.strategicLeadMaturityDivisor)
  );
  const partialThreshold = Math.max(
    outcomeModel.partialThresholdFloor,
    outcomeModel.partialThresholdBase -
      Math.floor(maturityPercent / outcomeModel.partialThresholdMaturityDivisor)
  );
  const partialLeadThreshold = Math.max(
    outcomeModel.partialLeadFloor,
    outcomeModel.partialLeadBase -
      Math.floor(maturityPercent / outcomeModel.partialLeadMaturityDivisor)
  );

  let category: SessionOutcome["category"] = null;
  let winningFactionId: string | null = null;

  if (
    catastrophicRiskPercent >=
      Math.max(
        78,
        outcomeModel.catastrophicBaseThreshold -
          Math.floor(maturityPercent / outcomeModel.catastrophicMaturityDivisor)
      ) &&
    maturityPercent >= outcomeModel.minResolutionMaturityPercent
  ) {
    category = "catastrophic_escalation";
  } else if (
    deescalationOpportunityPercent >=
      Math.max(
        70,
        outcomeModel.deescalationBaseThreshold -
          Math.floor(maturityPercent / outcomeModel.deescalationMaturityDivisor)
      ) &&
    input.worldTension <= 45 &&
    input.escalationRiskPercent <= 45 &&
    maturityPercent >= outcomeModel.minResolutionMaturityPercent
  ) {
    category = "crisis_deescalation";
  } else if (
    leaderProgress >= strategicThreshold &&
    lead >= strategicLeadThreshold &&
    maturityPercent >= outcomeModel.minResolutionMaturityPercent + 10
  ) {
    category = "strategic_success";
    winningFactionId = leaderFactionId;
  } else if (
    leaderProgress >= partialThreshold &&
    lead >= partialLeadThreshold &&
    maturityPercent >= outcomeModel.minResolutionMaturityPercent + 3 &&
    decisiveOutcomePercent >= 55
  ) {
    category = "partial_success";
    winningFactionId = leaderFactionId;
  } else if (
    maturityPercent >= outcomeModel.stalemateMaturityThreshold &&
    lead <= outcomeModel.stalemateLeadThreshold &&
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
      selectedOptionKind: input.selectedOption.kind,
      activePublicFlags: input.publicFlags ?? [],
      activeRevealedEvents: input.revealedEvents ?? []
    }
  });
}
