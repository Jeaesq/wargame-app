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
  warnings: z.array(z.string()).default([]),
  metadata: metadataSchema
});

export const advisorAnswerSchema = z.object({
  answerId: z.string().min(1),
  gameId: z.string().min(1),
  turnNumber: z.number().int().nonnegative(),
  perspectiveFactionId: z.string().min(1).nullable().default(null),
  summary: z.string().min(1),
  rationale: z.array(z.string()).min(1),
  recommendationBand: recommendationBandSchema,
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

export const resolvedActionSummarySchema = z.object({
  optionId: z.string().min(1),
  title: z.string().min(1),
  kind: actionKindSchema,
  recommendationPercent: z.number().min(0).max(100).nullable().default(null)
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
  selectedAction: resolvedActionSummarySchema,
  publicSummary: z.string().min(1),
  privateSummaries: z
    .array(
      z.object({
        playerId: z.string().min(1).nullable().default(null),
        factionId: z.string().min(1),
        summary: z.string().min(1),
        tags: tagsSchema
      })
    )
    .default([]),
  effects: z.array(z.string()).default([]),
  stateChanges: z.array(stateChangeSchema).default([]),
  updatedTracks: statsMapSchema,
  escalated: z.boolean().default(false),
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
  choiceCatalog: z.array(choiceOptionSchema).default([]),
  metadata: metadataSchema
});

export const gameSchema = z.object({
  id: z.string().min(1),
  scenarioId: z.string().min(1),
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
  metadata: metadataSchema
});

export const createGameRequestSchema = z.object({
  scenarioId: z.string().min(1),
  mode: gameModeSchema,
  players: z
    .array(
      z.object({
        name: z.string().min(1),
        role: playerRoleSchema.default("human"),
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
  resolution: turnResolutionSchema
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
export type ResolvedActionSummary = z.infer<typeof resolvedActionSummarySchema>;
export type StateChange = z.infer<typeof stateChangeSchema>;
export type CreateGameRequest = z.infer<typeof createGameRequestSchema>;
export type GamesListResponse = z.infer<typeof gamesListResponseSchema>;
export type ScenariosListResponse = z.infer<typeof scenariosListResponseSchema>;
export type CreateTurnRequest = z.infer<typeof createTurnRequestSchema>;
export type TurnResolutionResponse = z.infer<typeof turnResolutionResponseSchema>;
export type TurnsListResponse = z.infer<typeof turnsListResponseSchema>;
