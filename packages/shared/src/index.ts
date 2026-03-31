import { z } from "zod";

export const appManifest = {
  name: "Wargame App",
  scenarioFocus: "Cold War MVP"
} as const;

export const healthStatusSchema = z.object({
  name: z.string(),
  status: z.literal("ok"),
  message: z.string()
});

const isoTimestampSchema = z.string().datetime();

const statsMapSchema = z.record(z.string(), z.number());
const tagsSchema = z.array(z.string()).default([]);
const metadataSchema = z.record(z.string(), z.unknown()).default({});

export const gameModeSchema = z.enum(["solo", "head_to_head", "hotseat"]);
export const gameStatusSchema = z.enum([
  "setup",
  "in_progress",
  "paused",
  "completed",
  "abandoned"
]);
export const playerRoleSchema = z.enum(["human", "ai", "observer"]);
export const factionRoleSchema = z.enum(["major_power", "regional_power", "non_aligned"]);
export const turnPhaseSchema = z.enum([
  "briefing",
  "planning",
  "action_selection",
  "resolution",
  "turn_complete"
]);
export const actionKindSchema = z.enum([
  "diplomatic",
  "military_signal",
  "intelligence",
  "economic",
  "propaganda",
  "special"
]);
export const choiceVisibilitySchema = z.enum(["public", "private", "conditional"]);
export const resolutionStatusSchema = z.enum([
  "accepted",
  "rejected",
  "resolved",
  "partial",
  "failed"
]);
export const recommendationBandSchema = z.enum([
  "low",
  "medium",
  "high",
  "uncertain"
]);
export const scenarioComplexitySchema = z.enum(["introductory", "standard", "advanced"]);
export const targetGameLengthSchema = z.enum(["short", "medium", "long"]);
export const outcomeCategorySchema = z.enum([
  "strategic_success",
  "partial_success",
  "stalemate",
  "crisis_deescalation",
  "catastrophic_escalation"
]);
export const outcomeStatusSchema = z.enum(["ongoing", "ended"]);
export const deterministicSessionModeSchema = z.enum(["off", "seeded"]);

export const choiceEffectProfileSchema = z.object({
  worldTensionDelta: z.number().int().min(-100).max(100).default(0),
  escalationRiskDelta: z.number().int().min(-100).max(100).default(0),
  visibleTrackDeltas: statsMapSchema,
  negotiationLeverageDeltas: statsMapSchema,
  factionMomentumDeltas: statsMapSchema,
  publicFlagAdds: tagsSchema,
  publicFlagRemoves: tagsSchema,
  revealedEventAdds: z.array(z.string()).default([]),
  warningAdds: z.array(z.string()).default([])
});

export const scenarioObjectiveSchema = z.object({
  id: z.string().min(1),
  factionId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  successSignals: z.array(z.string()).default([]),
  failureSignals: z.array(z.string()).default([]),
  visibility: z.enum(["public", "private"]).default("public"),
  metadata: metadataSchema
});

export const sessionOutcomePressureSchema = z.object({
  maturityPercent: z.number().min(0).max(100),
  decisiveOutcomePercent: z.number().min(0).max(100),
  deescalationOpportunityPercent: z.number().min(0).max(100),
  catastrophicRiskPercent: z.number().min(0).max(100)
});

export const sessionOutcomeSchema = z.object({
  status: outcomeStatusSchema.default("ongoing"),
  category: outcomeCategorySchema.nullable().default(null),
  title: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
  winningFactionId: z.string().min(1).nullable().default(null),
  achievedAtTurn: z.number().int().nonnegative().nullable().default(null),
  pressure: sessionOutcomePressureSchema,
  publicObjectiveProgress: statsMapSchema,
  metadata: metadataSchema
});

export const sessionDebugConfigSchema = z.object({
  mode: deterministicSessionModeSchema.default("off"),
  seed: z.string().min(1).nullable().default(null),
  streamCounters: z.record(z.string(), z.number().int().nonnegative()).default({})
});

export const createGameDebugConfigSchema = z.object({
  deterministicMode: z.boolean().default(false),
  seed: z.string().min(1).optional()
});

export const factionSchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  role: factionRoleSchema,
  description: z.string().min(1),
  doctrineSummary: z.string().min(1),
  publicTraits: tagsSchema,
  privateTraits: tagsSchema,
  colorToken: z.string().min(1).optional(),
  isPlayable: z.boolean().default(true),
  metadata: metadataSchema
});

export const playerSchema = z.object({
  id: z.string().min(1),
  gameId: z.string().min(1),
  name: z.string().min(1),
  role: playerRoleSchema,
  userId: z.string().min(1).nullable().default(null),
  factionId: z.string().min(1).nullable(),
  seat: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
  createdAt: isoTimestampSchema,
  metadata: metadataSchema
});

export const choiceOptionSchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
  factionId: z.string().min(1).nullable().default(null),
  kind: actionKindSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  detail: z.string().min(1).optional(),
  visibility: choiceVisibilitySchema.default("public"),
  requirementTags: tagsSchema,
  consequenceHints: tagsSchema,
  recommendationPercent: z.number().min(0).max(100).nullable().default(null),
  effectProfile: choiceEffectProfileSchema.default({
    worldTensionDelta: 0,
    escalationRiskDelta: 0,
    visibleTrackDeltas: {},
    negotiationLeverageDeltas: {},
    factionMomentumDeltas: {},
    publicFlagAdds: [],
    publicFlagRemoves: [],
    revealedEventAdds: [],
    warningAdds: []
  }),
  metadata: metadataSchema
});

export const publicGameStateSchema = z.object({
  gameId: z.string().min(1),
  scenarioId: z.string().min(1),
  turnNumber: z.number().int().nonnegative(),
  activeFactionId: z.string().min(1).nullable(),
  phase: turnPhaseSchema,
  worldTension: z.number().min(0).max(100),
  publicNarrative: z.string().default(""),
  headline: z.string().optional(),
  visibleTracks: statsMapSchema,
  publicFlags: tagsSchema,
  revealedEvents: z.array(z.string()).default([]),
  updatedAt: isoTimestampSchema,
  metadata: metadataSchema
});

export const privatePlayerStateSchema = z.object({
  gameId: z.string().min(1),
  playerId: z.string().min(1),
  factionId: z.string().min(1),
  turnNumber: z.number().int().nonnegative(),
  privateBriefing: z.string().default(""),
  intelligence: z.array(z.string()).default([]),
  hiddenTracks: statsMapSchema,
  secretFlags: tagsSchema,
  availableOptions: z.array(choiceOptionSchema).default([]),
  metadata: metadataSchema
});

export const derivedGameStateSchema = z.object({
  gameId: z.string().min(1),
  turnNumber: z.number().int().nonnegative(),
  actingPlayerIds: z.array(z.string()).default([]),
  legalActionIds: z.array(z.string()).default([]),
  recommendedActionIds: z.array(z.string()).default([]),
  escalationRiskPercent: z.number().min(0).max(100),
  negotiationLeverage: statsMapSchema,
  factionMomentum: statsMapSchema,
  outcome: sessionOutcomeSchema.default({
    status: "ongoing",
    category: null,
    title: null,
    summary: null,
    winningFactionId: null,
    achievedAtTurn: null,
    pressure: {
      maturityPercent: 0,
      decisiveOutcomePercent: 0,
      deescalationOpportunityPercent: 0,
      catastrophicRiskPercent: 0
    },
    publicObjectiveProgress: {},
    metadata: {}
  }),
  warnings: z.array(z.string()).default([]),
  metadata: metadataSchema
});

export const advisorAnswerSchema = z.object({
  answerId: z.string().min(1),
  gameId: z.string().min(1),
  turnNumber: z.number().int().nonnegative(),
  perspectiveFactionId: z.string().min(1).nullable().default(null),
  question: z.string().min(1).default(""),
  summary: z.string().min(1),
  shortAnswer: z.string().min(1),
  rationale: z.array(z.string()).min(1),
  recommendationBand: recommendationBandSchema,
  confidenceLabel: z.enum(["low", "medium", "high", "uncertain"]),
  recommendedOptionIds: z.array(z.string()).default([]),
  confidencePercent: z.number().min(0).max(100),
  riskNotes: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  metadata: metadataSchema
});

export const turnActionSchema = z.object({
  id: z.string().min(1),
  gameId: z.string().min(1),
  turnNumber: z.number().int().nonnegative(),
  playerId: z.string().min(1),
  factionId: z.string().min(1),
  optionId: z.string().min(1),
  kind: actionKindSchema,
  submittedAt: isoTimestampSchema,
  declaredIntent: z.string().optional(),
  parameters: metadataSchema,
  clientContext: metadataSchema
});

export const llmNarrativeUpdateSchema = z.object({
  headline: z.string().min(1),
  publicSummary: z.string().min(1),
  privateUpdates: z
    .array(
      z.object({
        factionId: z.string().min(1),
        summary: z.string().min(1),
        tags: tagsSchema
      })
    )
    .default([]),
  consequenceTags: tagsSchema,
  followupHooks: tagsSchema,
  metadata: metadataSchema
});

export const worldUpdateSuggestionSchema = z.object({
  key: z.enum(["worldTension", "escalationRiskPercent"]),
  direction: z.enum(["increase", "decrease", "hold"]),
  magnitude: z.enum(["low", "medium", "high"]),
  rationale: z.string().min(1)
});

export const privateTurnSummarySchema = z.object({
  playerId: z.string().min(1).nullable().default(null),
  factionId: z.string().min(1),
  summary: z.string().min(1),
  tags: tagsSchema
});

export const recommendedOptionNoteSchema = z.object({
  optionId: z.string().min(1),
  rationale: z.string().min(1)
});

export const turnGenerationArtifactsSchema = z.object({
  publicSummary: z.string().min(1),
  privateSummaries: z.array(privateTurnSummarySchema).default([]),
  effects: z.array(z.string()).default([]),
  recommendationLabels: tagsSchema,
  riskLabels: tagsSchema,
  recommendedNextOptionIds: z.array(z.string()).default([]),
  recommendedOptionNotes: z.array(recommendedOptionNoteSchema).default([]),
  worldUpdateSuggestions: z.array(worldUpdateSuggestionSchema).default([]),
  llmNarrative: llmNarrativeUpdateSchema,
  metadata: metadataSchema
});

export const botDecisionPayloadSchema = z.object({
  optionId: z.string().min(1),
  rationale: z.string().min(1),
  metadata: metadataSchema
});

export const advisorResponsePayloadSchema = z.object({
  summary: z.string().min(1),
  shortAnswer: z.string().min(1),
  rationale: z.array(z.string()).min(1),
  recommendationBand: recommendationBandSchema,
  confidenceLabel: z.enum(["low", "medium", "high", "uncertain"]),
  recommendedOptionIds: z.array(z.string()).default([]),
  confidencePercent: z.number().min(0).max(100),
  riskNotes: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  metadata: metadataSchema
});

export const resolvedActionSummarySchema = z.object({
  optionId: z.string().min(1),
  title: z.string().min(1),
  kind: actionKindSchema,
  recommendationPercent: z.number().min(0).max(100).nullable().default(null)
});

export const resolvedActorSchema = z.object({
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  playerRole: playerRoleSchema,
  factionId: z.string().min(1)
});

export const stateChangeSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  previousValue: z.number().nullable().default(null),
  newValue: z.number(),
  delta: z.number(),
  visibility: z.enum(["public", "private", "derived"]).default("public")
});

export const turnResolutionSchema = z.object({
  id: z.string().min(1),
  gameId: z.string().min(1),
  turnNumber: z.number().int().nonnegative(),
  actionId: z.string().min(1),
  status: resolutionStatusSchema,
  appliedOptionId: z.string().min(1),
  actingFactionId: z.string().min(1),
  actor: resolvedActorSchema,
  selectedAction: resolvedActionSummarySchema,
  publicSummary: z.string().min(1),
  privateSummaries: z.array(privateTurnSummarySchema).default([]),
  effects: z.array(z.string()).default([]),
  stateChanges: z.array(stateChangeSchema).default([]),
  updatedTracks: statsMapSchema,
  escalated: z.boolean().default(false),
  sessionOutcome: sessionOutcomeSchema.nullable().default(null),
  recommendationLabels: tagsSchema,
  riskLabels: tagsSchema,
  llmNarrative: llmNarrativeUpdateSchema,
  resolvedAt: isoTimestampSchema,
  metadata: metadataSchema
});

export const scenarioDefinitionSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  historicalFrame: z.string().min(1),
  complexity: scenarioComplexitySchema,
  supportedModes: z.array(gameModeSchema).min(1),
  maxPlayers: z.number().int().positive(),
  startingTurn: z.number().int().nonnegative().default(1),
  factions: z.array(factionSchema).min(1),
  openingState: z.object({
    publicState: publicGameStateSchema.omit({
      gameId: true,
      updatedAt: true
    }),
    privateStates: z.array(
      privatePlayerStateSchema.omit({
        gameId: true,
        playerId: true,
        turnNumber: true
      })
    ),
    derivedState: derivedGameStateSchema.omit({
      gameId: true,
      turnNumber: true,
      actingPlayerIds: true,
      legalActionIds: true,
      recommendedActionIds: true
    }),
    initialOptions: z.array(choiceOptionSchema).default([])
  }),
  objectives: z.array(scenarioObjectiveSchema).default([]),
  choiceCatalog: z.array(choiceOptionSchema).default([]),
  metadata: metadataSchema
});

export const gameSchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
  ownerUserId: z.string().min(1),
  mode: gameModeSchema,
  status: gameStatusSchema,
  turnNumber: z.number().int().nonnegative(),
  phase: turnPhaseSchema,
  currentFactionId: z.string().min(1).nullable(),
  players: z.array(playerSchema).default([]),
  factions: z.array(factionSchema).default([]),
  state: z.object({
    public: publicGameStateSchema,
    privateByPlayer: z.array(privatePlayerStateSchema).default([]),
    derived: derivedGameStateSchema
  }),
  advisorAnswers: z.array(advisorAnswerSchema).default([]),
  lastResolution: turnResolutionSchema.nullable().default(null),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  sessionConfig: z.object({
    targetGameLength: targetGameLengthSchema.default("medium"),
    debug: sessionDebugConfigSchema.default({
      mode: "off",
      seed: null,
      streamCounters: {}
    })
  }),
  metadata: metadataSchema
});

export const createGameRequestSchema = z.object({
  scenarioId: z.string().min(1),
  mode: gameModeSchema,
  targetGameLength: targetGameLengthSchema.default("medium"),
  debug: createGameDebugConfigSchema.optional(),
  players: z
    .array(
      z.object({
        name: z.string().min(1),
        role: playerRoleSchema.default("human"),
        userId: z.string().min(1).optional(),
        factionId: z.string().min(1).optional()
      })
    )
    .min(1)
});

export const gamesListResponseSchema = z.object({
  games: z.array(gameSchema)
});

export const scenariosListResponseSchema = z.object({
  scenarios: z.array(scenarioDefinitionSchema)
});

export const advisorQuestionRequestSchema = z.object({
  factionId: z.string().min(1).nullable().optional(),
  playerId: z.string().min(1).optional(),
  question: z.string().min(1)
});

export const createTurnRequestSchema = z.object({
  playerId: z.string().min(1),
  factionId: z.string().min(1),
  optionId: z.string().min(1),
  declaredIntent: z.string().min(1).optional(),
  parameters: z.record(z.string(), z.unknown()).default({}),
  clientContext: z.record(z.string(), z.unknown()).default({})
});

export const turnResolutionResponseSchema = z.object({
  game: gameSchema,
  resolution: turnResolutionSchema,
  followupResolutions: z.array(turnResolutionSchema).default([])
});

export const turnsListResponseSchema = z.object({
  turns: z.array(turnResolutionSchema)
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type GameMode = z.infer<typeof gameModeSchema>;
export type GameStatus = z.infer<typeof gameStatusSchema>;
export type PlayerRole = z.infer<typeof playerRoleSchema>;
export type FactionRole = z.infer<typeof factionRoleSchema>;
export type TurnPhase = z.infer<typeof turnPhaseSchema>;
export type ActionKind = z.infer<typeof actionKindSchema>;
export type ChoiceVisibility = z.infer<typeof choiceVisibilitySchema>;
export type ResolutionStatus = z.infer<typeof resolutionStatusSchema>;
export type RecommendationBand = z.infer<typeof recommendationBandSchema>;
export type ScenarioComplexity = z.infer<typeof scenarioComplexitySchema>;
export type TargetGameLength = z.infer<typeof targetGameLengthSchema>;
export type OutcomeCategory = z.infer<typeof outcomeCategorySchema>;
export type OutcomeStatus = z.infer<typeof outcomeStatusSchema>;
export type DeterministicSessionMode = z.infer<typeof deterministicSessionModeSchema>;
export type Game = z.infer<typeof gameSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Faction = z.infer<typeof factionSchema>;
export type PublicGameState = z.infer<typeof publicGameStateSchema>;
export type PrivatePlayerState = z.infer<typeof privatePlayerStateSchema>;
export type DerivedGameState = z.infer<typeof derivedGameStateSchema>;
export type TurnAction = z.infer<typeof turnActionSchema>;
export type TurnResolution = z.infer<typeof turnResolutionSchema>;
export type AdvisorAnswer = z.infer<typeof advisorAnswerSchema>;
export type ScenarioDefinition = z.infer<typeof scenarioDefinitionSchema>;
export type ChoiceOption = z.infer<typeof choiceOptionSchema>;
export type ChoiceEffectProfile = z.infer<typeof choiceEffectProfileSchema>;
export type ScenarioObjective = z.infer<typeof scenarioObjectiveSchema>;
export type SessionOutcome = z.infer<typeof sessionOutcomeSchema>;
export type SessionOutcomePressure = z.infer<typeof sessionOutcomePressureSchema>;
export type SessionDebugConfig = z.infer<typeof sessionDebugConfigSchema>;
export type TurnGenerationArtifacts = z.infer<typeof turnGenerationArtifactsSchema>;
export type RecommendedOptionNote = z.infer<typeof recommendedOptionNoteSchema>;
export type WorldUpdateSuggestion = z.infer<typeof worldUpdateSuggestionSchema>;
export type BotDecisionPayload = z.infer<typeof botDecisionPayloadSchema>;
export type AdvisorResponsePayload = z.infer<typeof advisorResponsePayloadSchema>;
export type ResolvedActionSummary = z.infer<typeof resolvedActionSummarySchema>;
export type ResolvedActor = z.infer<typeof resolvedActorSchema>;
export type StateChange = z.infer<typeof stateChangeSchema>;
export type CreateGameDebugConfig = z.infer<typeof createGameDebugConfigSchema>;
export type CreateGameRequest = z.infer<typeof createGameRequestSchema>;
export type GamesListResponse = z.infer<typeof gamesListResponseSchema>;
export type ScenariosListResponse = z.infer<typeof scenariosListResponseSchema>;
export type CreateTurnRequest = z.infer<typeof createTurnRequestSchema>;
export type TurnResolutionResponse = z.infer<typeof turnResolutionResponseSchema>;
export type TurnsListResponse = z.infer<typeof turnsListResponseSchema>;

export type SessionAccessRole = "owner" | "controller" | "participant" | "none";
export type PlayerAssignmentStatus = "claimed_human" | "open_human" | "ai_controlled" | "observer";

export function getPlayerAssignmentStatus(player: Player): PlayerAssignmentStatus {
  if (player.role === "observer") {
    return "observer";
  }

  if (player.role === "ai") {
    return "ai_controlled";
  }

  return player.userId ? "claimed_human" : "open_human";
}

export function isPlayerControlledByUser(player: Player, userId: string): boolean {
  return player.userId === userId;
}

export function isPlayerClaimableByUser(player: Player): boolean {
  return player.role === "human" && !player.userId;
}

export function listPlayersControlledByUser(game: Game, userId: string): Player[] {
  return game.players.filter((player) => isPlayerControlledByUser(player, userId));
}

export function canUserAccessGame(game: Game, userId: string): boolean {
  return game.ownerUserId === userId || listPlayersControlledByUser(game, userId).length > 0;
}

export function getUserSessionAccessRole(game: Game, userId: string): SessionAccessRole {
  if (game.ownerUserId === userId) {
    return "owner";
  }

  if (listPlayersControlledByUser(game, userId).length > 0) {
    return "controller";
  }

  return "none";
}
