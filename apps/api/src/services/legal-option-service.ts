import { z } from "zod";
import type {
  ChoiceOption,
  PrivatePlayerState,
  PublicGameState,
  ScenarioDefinition
} from "@wargame/shared";

const optionRulesSchema = z
  .object({
    requiredPublicFlags: z.array(z.string()).default([]),
    forbiddenPublicFlags: z.array(z.string()).default([]),
    requiredSecretFlags: z.array(z.string()).default([]),
    forbiddenSecretFlags: z.array(z.string()).default([]),
    requiredRevealedEvents: z.array(z.string()).default([]),
    forbiddenRevealedEvents: z.array(z.string()).default([]),
    minWorldTension: z.number().min(0).max(100).nullable().default(null),
    maxWorldTension: z.number().min(0).max(100).nullable().default(null),
    minVisibleTracks: z.record(z.string(), z.number()).default({}),
    maxVisibleTracks: z.record(z.string(), z.number()).default({}),
    minHiddenTracks: z.record(z.string(), z.number()).default({}),
    maxHiddenTracks: z.record(z.string(), z.number()).default({}),
    oncePerGame: z.boolean().default(false),
    cooldownRounds: z.number().int().nonnegative().default(0),
    followupToOptionIds: z.array(z.string()).default([])
  })
  .strict();

const optionUsageEntrySchema = z.object({
  timesUsed: z.number().int().nonnegative().default(0),
  lastUsedRound: z.number().int().nonnegative().nullable().default(null)
});

const optionUsageMapSchema = z.record(z.string(), optionUsageEntrySchema);

const effectProfileOverrideSchema = z
  .object({
    worldTensionDelta: z.number().int().min(-100).max(100).optional(),
    escalationRiskDelta: z.number().int().min(-100).max(100).optional(),
    visibleTrackDeltas: z.record(z.string(), z.number()).optional(),
    negotiationLeverageDeltas: z.record(z.string(), z.number()).optional(),
    factionMomentumDeltas: z.record(z.string(), z.number()).optional(),
    publicFlagAdds: z.array(z.string()).optional(),
    publicFlagRemoves: z.array(z.string()).optional(),
    revealedEventAdds: z.array(z.string()).optional(),
    warningAdds: z.array(z.string()).optional()
  })
  .strict();

const generatedVariantSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1).optional(),
    summary: z.string().min(1).optional(),
    detail: z.string().min(1).optional(),
    kind: z
      .enum([
        "diplomatic",
        "military_signal",
        "intelligence",
        "economic",
        "propaganda",
        "special"
      ])
      .optional(),
    visibility: z.enum(["public", "private", "conditional"]).optional(),
    requirementTags: z.array(z.string()).optional(),
    consequenceHints: z.array(z.string()).optional(),
    recommendationPercent: z.number().min(0).max(100).nullable().optional(),
    effectProfile: effectProfileOverrideSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).default({})
  })
  .strict();

const generatedVariantsSchema = z.array(generatedVariantSchema);

type OptionRules = z.infer<typeof optionRulesSchema>;
type OptionUsageMap = z.infer<typeof optionUsageMapSchema>;
type GeneratedVariant = z.infer<typeof generatedVariantSchema>;

export type LegalOptionInput = {
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
  currentRound: number;
};

function parseOptionRules(option: ChoiceOption): OptionRules {
  const rawRules =
    option.metadata && typeof option.metadata.optionRules === "object"
      ? option.metadata.optionRules
      : {};

  return optionRulesSchema.parse(rawRules);
}

function parseGeneratedVariants(option: ChoiceOption): GeneratedVariant[] {
  const rawVariants =
    option.metadata && Array.isArray(option.metadata.generatedVariants)
      ? option.metadata.generatedVariants
      : [];

  return generatedVariantsSchema.parse(rawVariants);
}

function readOptionUsageMap(metadata?: Record<string, unknown>): OptionUsageMap {
  const rawUsage =
    metadata && typeof metadata.optionUsage === "object" ? metadata.optionUsage : {};

  return optionUsageMapSchema.parse(rawUsage);
}

function hasAllTags(required: string[], actual: Set<string>) {
  return required.every((value) => actual.has(value));
}

function hasNoTags(forbidden: string[], actual: Set<string>) {
  return forbidden.every((value) => !actual.has(value));
}

function satisfiesTrackMinimums(
  minimums: Record<string, number>,
  current: Record<string, number>
) {
  return Object.entries(minimums).every(([key, minimum]) => (current[key] ?? 0) >= minimum);
}

function satisfiesTrackMaximums(
  maximums: Record<string, number>,
  current: Record<string, number>
) {
  return Object.entries(maximums).every(([key, maximum]) => (current[key] ?? 0) <= maximum);
}

function isOptionLegal(input: {
  option: ChoiceOption;
  publicState: LegalOptionInput["publicState"];
  privateState: LegalOptionInput["privateState"];
  currentRound: number;
  optionUsage: OptionUsageMap;
}) {
  const rules = parseOptionRules(input.option);
  const publicFlags = new Set(input.publicState.publicFlags);
  const revealedEvents = new Set(input.publicState.revealedEvents);
  const secretFlags = new Set(input.privateState?.secretFlags ?? []);
  const hiddenTracks = input.privateState?.hiddenTracks ?? {};
  const usage = input.optionUsage[input.option.id] ?? {
    timesUsed: 0,
    lastUsedRound: null
  };

  if (rules.minWorldTension !== null && input.publicState.worldTension < rules.minWorldTension) {
    return false;
  }

  if (rules.maxWorldTension !== null && input.publicState.worldTension > rules.maxWorldTension) {
    return false;
  }

  if (!hasAllTags(rules.requiredPublicFlags, publicFlags)) {
    return false;
  }

  if (!hasNoTags(rules.forbiddenPublicFlags, publicFlags)) {
    return false;
  }

  if (!hasAllTags(rules.requiredRevealedEvents, revealedEvents)) {
    return false;
  }

  if (!hasNoTags(rules.forbiddenRevealedEvents, revealedEvents)) {
    return false;
  }

  if (!hasAllTags(rules.requiredSecretFlags, secretFlags)) {
    return false;
  }

  if (!hasNoTags(rules.forbiddenSecretFlags, secretFlags)) {
    return false;
  }

  if (!satisfiesTrackMinimums(rules.minVisibleTracks, input.publicState.visibleTracks)) {
    return false;
  }

  if (!satisfiesTrackMaximums(rules.maxVisibleTracks, input.publicState.visibleTracks)) {
    return false;
  }

  if (!satisfiesTrackMinimums(rules.minHiddenTracks, hiddenTracks)) {
    return false;
  }

  if (!satisfiesTrackMaximums(rules.maxHiddenTracks, hiddenTracks)) {
    return false;
  }

  if (rules.oncePerGame && usage.timesUsed > 0) {
    return false;
  }

  if (
    rules.cooldownRounds > 0 &&
    usage.lastUsedRound !== null &&
    input.currentRound - usage.lastUsedRound < rules.cooldownRounds
  ) {
    return false;
  }

  if (
    rules.followupToOptionIds.length > 0 &&
    !rules.followupToOptionIds.some((optionId) => (input.optionUsage[optionId]?.timesUsed ?? 0) > 0)
  ) {
    return false;
  }

  return true;
}

function mergeEffectProfile(
  base: ChoiceOption["effectProfile"],
  overrides?: GeneratedVariant["effectProfile"]
): ChoiceOption["effectProfile"] {
  if (!overrides) {
    return base;
  }

  return {
    worldTensionDelta: overrides.worldTensionDelta ?? base.worldTensionDelta,
    escalationRiskDelta: overrides.escalationRiskDelta ?? base.escalationRiskDelta,
    visibleTrackDeltas: {
      ...base.visibleTrackDeltas,
      ...(overrides.visibleTrackDeltas ?? {})
    },
    negotiationLeverageDeltas: {
      ...base.negotiationLeverageDeltas,
      ...(overrides.negotiationLeverageDeltas ?? {})
    },
    factionMomentumDeltas: {
      ...base.factionMomentumDeltas,
      ...(overrides.factionMomentumDeltas ?? {})
    },
    publicFlagAdds: overrides.publicFlagAdds ?? base.publicFlagAdds,
    publicFlagRemoves: overrides.publicFlagRemoves ?? base.publicFlagRemoves,
    revealedEventAdds: overrides.revealedEventAdds ?? base.revealedEventAdds,
    warningAdds: overrides.warningAdds ?? base.warningAdds
  };
}

function expandGeneratedVariants(option: ChoiceOption): ChoiceOption[] {
  const generatedVariants = parseGeneratedVariants(option);

  if (generatedVariants.length === 0) {
    return [option];
  }

  return generatedVariants.map((variant) => ({
    ...option,
    id: variant.id,
    title: variant.title ?? option.title,
    summary: variant.summary ?? option.summary,
    detail: variant.detail ?? option.detail,
    kind: variant.kind ?? option.kind,
    visibility: variant.visibility ?? option.visibility,
    requirementTags: variant.requirementTags ?? option.requirementTags,
    consequenceHints: variant.consequenceHints ?? option.consequenceHints,
    recommendationPercent:
      variant.recommendationPercent !== undefined
        ? variant.recommendationPercent
        : option.recommendationPercent,
    effectProfile: mergeEffectProfile(option.effectProfile, variant.effectProfile),
    metadata: {
      ...option.metadata,
      ...variant.metadata,
      generatedFromOptionId: option.id
    }
  }));
}

export function listLegalOptions(input: LegalOptionInput): ChoiceOption[] {
  if (!input.factionId) {
    return [];
  }

  const optionUsage = readOptionUsageMap(input.privateState?.metadata);

  return input.scenario.choiceCatalog
    .filter((option) => option.factionId === input.factionId)
    .flatMap((option) => expandGeneratedVariants(option))
    .filter((option) =>
      isOptionLegal({
        option,
        publicState: input.publicState,
        privateState: input.privateState,
        currentRound: input.currentRound,
        optionUsage
      })
    );
}

export function recordOptionUsageInPrivateStateMetadata(input: {
  metadata: Record<string, unknown>;
  optionId: string;
  roundNumber: number;
}) {
  const optionUsage = readOptionUsageMap(input.metadata);
  const previous = optionUsage[input.optionId] ?? {
    timesUsed: 0,
    lastUsedRound: null
  };

  return {
    ...input.metadata,
    optionUsage: {
      ...optionUsage,
      [input.optionId]: {
        timesUsed: previous.timesUsed + 1,
        lastUsedRound: input.roundNumber
      }
    }
  };
}
