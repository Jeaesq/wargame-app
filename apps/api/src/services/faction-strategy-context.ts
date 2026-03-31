import type { ChoiceOption, Game, ScenarioDefinition } from "@wargame/shared";

export type FactionDoctrineProfile = {
  doctrineLabel: string;
  preferredCategories: string[];
  cautiousCategories: string[];
  categoryBiases: Partial<Record<string, number>>;
  pressureBias: number;
  restraintBias: number;
  initiativeBias: number;
  scenarioFocus: string | null;
  contestedPriority?: string;
  recoveryPriority?: string;
  protectionPriority?: string;
  escalationPriority?: string;
};

export type VisibleStrategicAssessment = {
  doctrineLabel: string;
  preferredCategories: string[];
  cautiousCategories: string[];
  scenarioFocus: string | null;
  ownObjectivePressure: number;
  rivalObjectivePressure: number;
  escalationRiskPercent: number;
  worldTension: number;
  strategicPosture: "recover" | "protect" | "contest";
  visiblePriority: string;
};

function getOptionCategory(kind: ChoiceOption["kind"]) {
  switch (kind) {
    case "military_signal":
      return "military";
    case "intelligence":
      return "intelligence";
    case "economic":
      return "economic";
    case "propaganda":
      return "propaganda";
    case "special":
      return "special";
    default:
      return "diplomatic";
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function getStrategyProfileMetadata(
  faction: Game["factions"][number] | null | undefined
): Partial<FactionDoctrineProfile> | null {
  const candidate = faction?.metadata?.strategyProfile;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const categoryBiases =
    record.categoryBiases && typeof record.categoryBiases === "object" && !Array.isArray(record.categoryBiases)
      ? (Object.fromEntries(
          Object.entries(record.categoryBiases as Record<string, unknown>).filter(
            ([, value]) => typeof value === "number"
          )
        ) as Partial<Record<string, number>>)
      : undefined;

  return {
    doctrineLabel:
      typeof record.doctrineLabel === "string" ? record.doctrineLabel : undefined,
    preferredCategories: isStringArray(record.preferredCategories)
      ? record.preferredCategories
      : undefined,
    cautiousCategories: isStringArray(record.cautiousCategories)
      ? record.cautiousCategories
      : undefined,
    categoryBiases,
    pressureBias: typeof record.pressureBias === "number" ? record.pressureBias : undefined,
    restraintBias: typeof record.restraintBias === "number" ? record.restraintBias : undefined,
    initiativeBias:
      typeof record.initiativeBias === "number" ? record.initiativeBias : undefined,
    scenarioFocus: typeof record.scenarioFocus === "string" ? record.scenarioFocus : undefined,
    contestedPriority:
      typeof record.contestedPriority === "string" ? record.contestedPriority : undefined,
    recoveryPriority:
      typeof record.recoveryPriority === "string" ? record.recoveryPriority : undefined,
    protectionPriority:
      typeof record.protectionPriority === "string" ? record.protectionPriority : undefined,
    escalationPriority:
      typeof record.escalationPriority === "string" ? record.escalationPriority : undefined
  };
}

function mergeDoctrineProfiles(
  base: FactionDoctrineProfile,
  override: Partial<FactionDoctrineProfile> | null
): FactionDoctrineProfile {
  if (!override) {
    return base;
  }

  return {
    doctrineLabel: override.doctrineLabel ?? base.doctrineLabel,
    preferredCategories: override.preferredCategories ?? base.preferredCategories,
    cautiousCategories: override.cautiousCategories ?? base.cautiousCategories,
    categoryBiases: {
      ...base.categoryBiases,
      ...(override.categoryBiases ?? {})
    },
    pressureBias: override.pressureBias ?? base.pressureBias,
    restraintBias: override.restraintBias ?? base.restraintBias,
    initiativeBias: override.initiativeBias ?? base.initiativeBias,
    scenarioFocus: override.scenarioFocus ?? base.scenarioFocus,
    contestedPriority: override.contestedPriority ?? base.contestedPriority,
    recoveryPriority: override.recoveryPriority ?? base.recoveryPriority,
    protectionPriority: override.protectionPriority ?? base.protectionPriority,
    escalationPriority: override.escalationPriority ?? base.escalationPriority
  };
}

export function getFactionDoctrineProfile(input: {
  scenario?: ScenarioDefinition;
  game: Game;
  factionId: string;
}): FactionDoctrineProfile {
  const faction = input.game.factions.find((candidate) => candidate.id === input.factionId);
  const slug = faction?.slug ?? input.factionId;
  const metadataOverride = getStrategyProfileMetadata(faction);

  const defaultProfile = (() => {
    switch (slug) {
      case "usa":
        return {
          doctrineLabel: "measured resolve",
          preferredCategories: ["diplomatic", "intelligence", "military"],
          cautiousCategories: ["military"],
          categoryBiases: {
            diplomatic: 2,
            intelligence: 3
          },
          pressureBias: 2,
          restraintBias: 8,
          initiativeBias: 4,
          scenarioFocus: "superpower signaling and allied credibility"
        };
      case "ussr":
        return {
          doctrineLabel: "coercive leverage",
          preferredCategories: ["economic", "military", "diplomatic"],
          cautiousCategories: ["military"],
          categoryBiases: {
            economic: 3,
            military: 2
          },
          pressureBias: 9,
          restraintBias: 2,
          initiativeBias: 8,
          scenarioFocus: "controlled coercion and deterrent ambiguity"
        };
      case "anglo-french":
        return {
          doctrineLabel: "fast pressure under shrinking political time",
          preferredCategories: ["military", "economic", "diplomatic"],
          cautiousCategories: ["military"],
          categoryBiases: {
            military: 4,
            diplomatic: 1
          },
          pressureBias: 8,
          restraintBias: 1,
          initiativeBias: 9,
          scenarioFocus: "coalition tempo before diplomatic isolation closes the window"
        };
      case "egypt":
        return {
          doctrineLabel: "political endurance and legitimacy",
          preferredCategories: ["propaganda", "diplomatic", "intelligence"],
          cautiousCategories: ["military"],
          categoryBiases: {
            propaganda: 4,
            diplomatic: 2
          },
          pressureBias: 3,
          restraintBias: 7,
          initiativeBias: 5,
          scenarioFocus: "sovereignty, legitimacy, and outside political pressure"
        };
      default:
        return {
          doctrineLabel: faction?.doctrineSummary ?? "balanced crisis management",
          preferredCategories: ["diplomatic", "economic", "intelligence"],
          cautiousCategories: ["military"],
          categoryBiases: {},
          pressureBias: 4,
          restraintBias: 4,
          initiativeBias: 4,
          scenarioFocus: null
        };
    }
  })();

  return mergeDoctrineProfiles(defaultProfile, metadataOverride);
}

export function buildFactionStrategicSnapshot(input: {
  scenario?: ScenarioDefinition;
  game: Game;
  factionId: string;
}) {
  const doctrine = getFactionDoctrineProfile(input);
  const privateState = input.game.state.privateByPlayer.find(
    (state) => state.factionId === input.factionId
  );
  const ownProgress = input.game.state.derived.outcome.publicObjectiveProgress[input.factionId] ?? 50;
  const rivalProgress = Math.max(
    ...Object.entries(input.game.state.derived.outcome.publicObjectiveProgress)
      .filter(([factionId]) => factionId !== input.factionId)
      .map(([, value]) => value),
    50
  );

  return {
    doctrine,
    ownProgress,
    rivalProgress,
    behind: ownProgress + 4 < rivalProgress,
    ahead: ownProgress > rivalProgress + 4,
    escalationRisk: input.game.state.derived.escalationRiskPercent,
    worldTension: input.game.state.public.worldTension,
    hiddenTracks: privateState?.hiddenTracks ?? {},
    secretFlags: new Set(privateState?.secretFlags ?? []),
    preferredCategories: new Set(doctrine.preferredCategories),
    cautiousCategories: new Set(doctrine.cautiousCategories)
  };
}

export function buildVisibleStrategicAssessment(input: {
  scenario?: ScenarioDefinition;
  game: Game;
  factionId: string;
}): VisibleStrategicAssessment {
  const snapshot = buildFactionStrategicSnapshot(input);
  const strategicPosture = snapshot.behind
    ? "recover"
    : snapshot.ahead
      ? "protect"
      : "contest";

  let visiblePriority = `The visible contest is still balanced, so ${snapshot.doctrine.doctrineLabel} should guide which legal pressure you apply next.`;

  if (snapshot.escalationRisk >= 75 || snapshot.worldTension >= 78) {
    visiblePriority =
      snapshot.doctrine.escalationPriority ??
      `Escalation is near the limit, so ${snapshot.doctrine.doctrineLabel} should favor controlled options over raw confrontation.`;
  } else if (snapshot.behind) {
    visiblePriority =
      snapshot.doctrine.recoveryPriority ??
      `Visible objective pressure is slipping, so ${snapshot.doctrine.doctrineLabel} should recover leverage before the round hardens.`;
  } else if (snapshot.ahead) {
    visiblePriority =
      snapshot.doctrine.protectionPriority ??
      `Your side is visibly ahead, so ${snapshot.doctrine.doctrineLabel} should protect that edge without inviting unnecessary escalation.`;
  } else if (snapshot.doctrine.contestedPriority) {
    visiblePriority = snapshot.doctrine.contestedPriority;
  }

  return {
    doctrineLabel: snapshot.doctrine.doctrineLabel,
    preferredCategories: [...snapshot.doctrine.preferredCategories],
    cautiousCategories: [...snapshot.doctrine.cautiousCategories],
    scenarioFocus: snapshot.doctrine.scenarioFocus,
    ownObjectivePressure: snapshot.ownProgress,
    rivalObjectivePressure: snapshot.rivalProgress,
    escalationRiskPercent: snapshot.escalationRisk,
    worldTension: snapshot.worldTension,
    strategicPosture,
    visiblePriority
  };
}

export function describeOptionFitForDoctrine(input: {
  option: ChoiceOption;
  doctrine: FactionDoctrineProfile;
}) {
  const category = getOptionCategory(input.option.kind);

  if (input.doctrine.preferredCategories.includes(category)) {
    return "fits current doctrine";
  }

  if (input.doctrine.cautiousCategories.includes(category)) {
    return "pushes the doctrine toward higher risk";
  }

  return "sits outside the faction's default comfort zone";
}

export function getStrategicCategory(option: ChoiceOption) {
  return getOptionCategory(option.kind);
}
