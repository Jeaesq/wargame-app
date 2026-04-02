import type { ChoiceOption, ScenarioDefinition } from "@wargame/shared";

type ScenarioEventState = {
  roundNumber: number;
  worldTension: number;
  escalationRiskPercent: number;
  visibleTracks: Record<string, number>;
  publicFlags: string[];
  revealedEvents: string[];
  warnings: string[];
};

type TriggeredScenarioEventsResult = ScenarioEventState & {
  triggeredEventIds: string[];
};

type ParsedEventRule = {
  id: string;
  minRound?: number;
  maxRound?: number;
  minWorldTension?: number;
  maxWorldTension?: number;
  minEscalationRisk?: number;
  maxEscalationRisk?: number;
  requiredPublicFlags: string[];
  absentPublicFlags: string[];
  requiredRevealedEvents: string[];
  absentRevealedEvents: string[];
  requiredSelectedOptionIds: string[];
  requiredActionKinds: string[];
  visibleTrackMins: Record<string, number>;
  effect: {
    revealEventId: string;
    worldTensionDelta: number;
    escalationRiskDelta: number;
    visibleTrackDeltas: Record<string, number>;
    publicFlagAdds: string[];
    warningAdds: string[];
  };
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "number")
  );
}

function parseEventRules(scenario: ScenarioDefinition): ParsedEventRule[] {
  const candidate = scenario.metadata?.eventRules;

  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.flatMap((entry, index) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const effect =
      typeof record.effect === "object" && record.effect !== null && !Array.isArray(record.effect)
        ? (record.effect as Record<string, unknown>)
        : {};
    const revealEventId =
      typeof effect.revealEventId === "string"
        ? effect.revealEventId
        : typeof record.id === "string"
          ? record.id
          : `event-${index}`;

    return [
      {
        id: typeof record.id === "string" ? record.id : revealEventId,
        minRound: typeof record.minRound === "number" ? record.minRound : undefined,
        maxRound: typeof record.maxRound === "number" ? record.maxRound : undefined,
        minWorldTension:
          typeof record.minWorldTension === "number" ? record.minWorldTension : undefined,
        maxWorldTension:
          typeof record.maxWorldTension === "number" ? record.maxWorldTension : undefined,
        minEscalationRisk:
          typeof record.minEscalationRisk === "number"
            ? record.minEscalationRisk
            : undefined,
        maxEscalationRisk:
          typeof record.maxEscalationRisk === "number"
            ? record.maxEscalationRisk
            : undefined,
        requiredPublicFlags: isStringArray(record.requiredPublicFlags)
          ? record.requiredPublicFlags
          : [],
        absentPublicFlags: isStringArray(record.absentPublicFlags)
          ? record.absentPublicFlags
          : [],
        requiredRevealedEvents: isStringArray(record.requiredRevealedEvents)
          ? record.requiredRevealedEvents
          : [],
        absentRevealedEvents: isStringArray(record.absentRevealedEvents)
          ? record.absentRevealedEvents
          : [],
        requiredSelectedOptionIds: isStringArray(record.requiredSelectedOptionIds)
          ? record.requiredSelectedOptionIds
          : [],
        requiredActionKinds: isStringArray(record.requiredActionKinds)
          ? record.requiredActionKinds
          : [],
        visibleTrackMins: isNumberRecord(record.visibleTrackMins) ? record.visibleTrackMins : {},
        effect: {
          revealEventId,
          worldTensionDelta:
            typeof effect.worldTensionDelta === "number" ? effect.worldTensionDelta : 0,
          escalationRiskDelta:
            typeof effect.escalationRiskDelta === "number" ? effect.escalationRiskDelta : 0,
          visibleTrackDeltas: isNumberRecord(effect.visibleTrackDeltas)
            ? effect.visibleTrackDeltas
            : {},
          publicFlagAdds: isStringArray(effect.publicFlagAdds) ? effect.publicFlagAdds : [],
          warningAdds: isStringArray(effect.warningAdds) ? effect.warningAdds : []
        }
      }
    ];
  });
}

function applyTrackDeltas(
  current: Record<string, number>,
  deltas: Record<string, number>
) {
  const updated = { ...current };

  for (const [track, delta] of Object.entries(deltas)) {
    updated[track] = clampPercent((updated[track] ?? 0) + delta);
  }

  return updated;
}

export function applyScenarioEvents(input: {
  scenario: ScenarioDefinition;
  selectedOption: ChoiceOption;
  state: ScenarioEventState;
}): TriggeredScenarioEventsResult {
  const rules = parseEventRules(input.scenario);
  let currentState: TriggeredScenarioEventsResult = {
    ...input.state,
    triggeredEventIds: []
  };

  for (const rule of rules) {
    const revealedSet = new Set(currentState.revealedEvents);
    const publicFlagSet = new Set(currentState.publicFlags);
    const alreadyTriggered = revealedSet.has(rule.effect.revealEventId);
    const meetsRound =
      (rule.minRound === undefined || currentState.roundNumber >= rule.minRound) &&
      (rule.maxRound === undefined || currentState.roundNumber <= rule.maxRound);
    const meetsWorldTension =
      (rule.minWorldTension === undefined ||
        currentState.worldTension >= rule.minWorldTension) &&
      (rule.maxWorldTension === undefined ||
        currentState.worldTension <= rule.maxWorldTension);
    const meetsEscalation =
      (rule.minEscalationRisk === undefined ||
        currentState.escalationRiskPercent >= rule.minEscalationRisk) &&
      (rule.maxEscalationRisk === undefined ||
        currentState.escalationRiskPercent <= rule.maxEscalationRisk);
    const meetsFlags = rule.requiredPublicFlags.every((flag) => publicFlagSet.has(flag));
    const avoidsFlags = rule.absentPublicFlags.every((flag) => !publicFlagSet.has(flag));
    const meetsEvents = rule.requiredRevealedEvents.every((eventId) => revealedSet.has(eventId));
    const avoidsEvents = rule.absentRevealedEvents.every((eventId) => !revealedSet.has(eventId));
    const matchesOption =
      rule.requiredSelectedOptionIds.length === 0 ||
      rule.requiredSelectedOptionIds.includes(input.selectedOption.id);
    const matchesKind =
      rule.requiredActionKinds.length === 0 ||
      rule.requiredActionKinds.includes(input.selectedOption.kind);
    const meetsTracks = Object.entries(rule.visibleTrackMins).every(
      ([track, minimum]) => (currentState.visibleTracks[track] ?? 0) >= minimum
    );

    if (
      alreadyTriggered ||
      !meetsRound ||
      !meetsWorldTension ||
      !meetsEscalation ||
      !meetsFlags ||
      !avoidsFlags ||
      !meetsEvents ||
      !avoidsEvents ||
      !matchesOption ||
      !matchesKind ||
      !meetsTracks
    ) {
      continue;
    }

    revealedSet.add(rule.effect.revealEventId);
    const nextPublicFlags = new Set(currentState.publicFlags);

    for (const flag of rule.effect.publicFlagAdds) {
      nextPublicFlags.add(flag);
    }

    currentState = {
      roundNumber: currentState.roundNumber,
      worldTension: clampPercent(
        currentState.worldTension + rule.effect.worldTensionDelta
      ),
      escalationRiskPercent: clampPercent(
        currentState.escalationRiskPercent + rule.effect.escalationRiskDelta
      ),
      visibleTracks: applyTrackDeltas(
        currentState.visibleTracks,
        rule.effect.visibleTrackDeltas
      ),
      publicFlags: [...nextPublicFlags],
      revealedEvents: [...revealedSet],
      warnings: [...currentState.warnings, ...rule.effect.warningAdds],
      triggeredEventIds: [...currentState.triggeredEventIds, rule.effect.revealEventId]
    };
  }

  currentState.warnings = [...new Set(currentState.warnings)];

  return currentState;
}
