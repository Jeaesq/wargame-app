import type { ChoiceOption, Game, ScenarioDefinition } from "@wargame/shared";
import { getStrategicCategory } from "./faction-strategy-context.js";

type PrivateTrackDeltaMap = Record<string, number>;

type ThresholdRule = {
  track: string;
  min?: number;
  max?: number;
  addFlags?: string[];
  removeFlags?: string[];
};

type ParsedPrivateStateProfile = {
  defaultActingTrackDeltas: PrivateTrackDeltaMap;
  defaultReactingTrackDeltas: PrivateTrackDeltaMap;
  actingTrackDeltasByCategory: Record<string, PrivateTrackDeltaMap>;
  reactingTrackDeltasByCategory: Record<string, PrivateTrackDeltaMap>;
  actingFlagAddsByCategory: Record<string, string[]>;
  reactingFlagAddsByCategory: Record<string, string[]>;
  highTensionTrackDeltas: {
    acting: PrivateTrackDeltaMap;
    reacting: PrivateTrackDeltaMap;
  };
  thresholdRules: ThresholdRule[];
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isTrackDeltaMap(value: unknown): value is PrivateTrackDeltaMap {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "number")
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function parseTrackDeltaRecord(
  value: unknown
): Record<string, PrivateTrackDeltaMap> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) =>
      isTrackDeltaMap(entry) ? [[key, entry]] : []
    )
  );
}

function parseFlagRecord(value: unknown): Record<string, string[]> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) =>
      isStringArray(entry) ? [[key, entry]] : []
    )
  );
}

function parseThresholdRules(value: unknown): ThresholdRule[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return [];
    }

    const record = entry as Record<string, unknown>;

    if (typeof record.track !== "string") {
      return [];
    }

    return [
      {
        track: record.track,
        min: typeof record.min === "number" ? record.min : undefined,
        max: typeof record.max === "number" ? record.max : undefined,
        addFlags: isStringArray(record.addFlags) ? record.addFlags : undefined,
        removeFlags: isStringArray(record.removeFlags) ? record.removeFlags : undefined
      }
    ];
  });
}

function getPrivateStateProfile(
  state: Game["state"]["privateByPlayer"][number],
  game: Game
): ParsedPrivateStateProfile | null {
  const faction = game.factions.find((candidate) => candidate.id === state.factionId);
  const candidate = faction?.metadata?.privateStateProfile;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const highTensionTrackDeltasCandidate =
    typeof record.highTensionTrackDeltas === "object" &&
    record.highTensionTrackDeltas !== null &&
    !Array.isArray(record.highTensionTrackDeltas)
      ? (record.highTensionTrackDeltas as Record<string, unknown>)
      : {};

  return {
    defaultActingTrackDeltas: isTrackDeltaMap(record.defaultActingTrackDeltas)
      ? record.defaultActingTrackDeltas
      : {},
    defaultReactingTrackDeltas: isTrackDeltaMap(record.defaultReactingTrackDeltas)
      ? record.defaultReactingTrackDeltas
      : {},
    actingTrackDeltasByCategory: parseTrackDeltaRecord(record.actingTrackDeltasByCategory),
    reactingTrackDeltasByCategory: parseTrackDeltaRecord(record.reactingTrackDeltasByCategory),
    actingFlagAddsByCategory: parseFlagRecord(record.actingFlagAddsByCategory),
    reactingFlagAddsByCategory: parseFlagRecord(record.reactingFlagAddsByCategory),
    highTensionTrackDeltas: {
      acting: isTrackDeltaMap(highTensionTrackDeltasCandidate.acting)
        ? highTensionTrackDeltasCandidate.acting
        : {},
      reacting: isTrackDeltaMap(highTensionTrackDeltasCandidate.reacting)
        ? highTensionTrackDeltasCandidate.reacting
        : {}
    },
    thresholdRules: parseThresholdRules(record.thresholdRules)
  };
}

function applyTrackDeltas(
  hiddenTracks: Record<string, number>,
  deltas: PrivateTrackDeltaMap
) {
  const updated = { ...hiddenTracks };

  for (const [track, delta] of Object.entries(deltas)) {
    updated[track] = clampPercent((updated[track] ?? 50) + delta);
  }

  return updated;
}

export function evolvePrivateStatesAfterAction(input: {
  game: Game;
  scenario: ScenarioDefinition;
  actingFactionId: string;
  selectedOption: ChoiceOption;
  nextWorldTension: number;
  escalationRisk: number;
}) {
  const category = getStrategicCategory(input.selectedOption);
  const highTension = input.nextWorldTension >= 68 || input.escalationRisk >= 68;

  return input.game.state.privateByPlayer.map((state) => {
    const profile = getPrivateStateProfile(state, input.game);

    if (!profile) {
      return state;
    }

    const isActingFaction = state.factionId === input.actingFactionId;
    const roleTrackDeltas = isActingFaction
      ? profile.defaultActingTrackDeltas
      : profile.defaultReactingTrackDeltas;
    const categoryTrackDeltas = isActingFaction
      ? profile.actingTrackDeltasByCategory[category] ?? {}
      : profile.reactingTrackDeltasByCategory[category] ?? {};
    const highTensionTrackDeltas = highTension
      ? isActingFaction
        ? profile.highTensionTrackDeltas.acting
        : profile.highTensionTrackDeltas.reacting
      : {};
    const updatedHiddenTracks = applyTrackDeltas(
      applyTrackDeltas(
        applyTrackDeltas(state.hiddenTracks, roleTrackDeltas),
        categoryTrackDeltas
      ),
      highTensionTrackDeltas
    );
    const nextSecretFlags = new Set(state.secretFlags);
    const categoryFlags = isActingFaction
      ? profile.actingFlagAddsByCategory[category] ?? []
      : profile.reactingFlagAddsByCategory[category] ?? [];

    for (const flag of categoryFlags) {
      nextSecretFlags.add(flag);
    }

    for (const rule of profile.thresholdRules) {
      const value = updatedHiddenTracks[rule.track] ?? 50;
      const meetsMin = rule.min === undefined || value >= rule.min;
      const meetsMax = rule.max === undefined || value <= rule.max;

      if (meetsMin && meetsMax) {
        for (const flag of rule.addFlags ?? []) {
          nextSecretFlags.add(flag);
        }

        for (const flag of rule.removeFlags ?? []) {
          nextSecretFlags.delete(flag);
        }
      }
    }

    return {
      ...state,
      hiddenTracks: updatedHiddenTracks,
      secretFlags: [...nextSecretFlags]
    };
  });
}
