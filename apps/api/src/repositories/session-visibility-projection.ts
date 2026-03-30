import {
  gameSchema,
  type AdvisorAnswer,
  type ChoiceOption,
  type Game,
  type TurnResolution
} from "@wargame/shared";
import type { AdvisorVisibleContext, SessionViewSelection } from "./contracts.js";

// Projection rules:
// - `system` returns canonical state unchanged for backend-only workflows.
// - `public` removes faction-private state and action-specific derived ids.
// - `faction` keeps only the requested faction/player private slices while preserving
//   the shared public state and safe derived signals.

type SessionProjectionScope =
  | {
      kind: "public";
    }
  | {
      kind: "faction";
      playerIds: string[];
      factionIds: string[];
    }
  | {
      kind: "system";
    };

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function uniqueOptionsById(options: ChoiceOption[]): ChoiceOption[] {
  const seen = new Set<string>();

  return options.filter((option) => {
    if (seen.has(option.id)) {
      return false;
    }

    seen.add(option.id);
    return true;
  });
}

function getPlayerById(session: Game, playerId?: string) {
  return playerId ? session.players.find((player) => player.id === playerId) ?? null : null;
}

function getFactionIdsForSelection(
  session: Game,
  selection: SessionViewSelection
): string[] {
  const playerFactionId = getPlayerById(session, selection.playerId)?.factionId ?? null;
  const requestedFactionIds = unique(
    [playerFactionId, selection.factionId ?? null].filter(
      (value): value is string => Boolean(value)
    )
  );

  if (requestedFactionIds.length > 0) {
    return requestedFactionIds;
  }

  const activeHumanFactionIds = unique(
    session.players
      .filter((player) => player.role === "human" && player.isActive)
      .map((player) => player.factionId)
      .filter((factionId): factionId is string => Boolean(factionId))
  );

  return activeHumanFactionIds.length === 1 ? activeHumanFactionIds : [];
}

function getPlayerIdsForFactions(session: Game, factionIds: string[]): string[] {
  const allowedFactionIds = new Set(factionIds);

  return session.players
    .filter((player) => player.factionId && allowedFactionIds.has(player.factionId))
    .map((player) => player.id);
}

export function resolveSessionProjectionScope(
  session: Game,
  selection: SessionViewSelection = {}
): SessionProjectionScope {
  const view = selection.view ?? "default";

  if (view === "system") {
    return {
      kind: "system"
    };
  }

  if (view === "public") {
    return {
      kind: "public"
    };
  }

  const factionIds = getFactionIdsForSelection(session, selection);

  if (factionIds.length === 0) {
    return {
      kind: "public"
    };
  }

  const playerIds = selection.playerId
    ? [selection.playerId]
    : getPlayerIdsForFactions(session, factionIds);

  return {
    kind: "faction",
    playerIds,
    factionIds
  };
}

function projectResolutionForScope(
  resolution: TurnResolution | null,
  scope: SessionProjectionScope
): TurnResolution | null {
  if (!resolution) {
    return null;
  }

  if (scope.kind === "system") {
    return resolution;
  }

  if (scope.kind === "public") {
    return {
      ...resolution,
      privateSummaries: [],
      llmNarrative: {
        ...resolution.llmNarrative,
        privateUpdates: []
      }
    };
  }

  const allowedPlayerIds = new Set(scope.playerIds);
  const allowedFactionIds = new Set(scope.factionIds);

  return {
    ...resolution,
    privateSummaries: resolution.privateSummaries.filter(
      (summary) =>
        allowedFactionIds.has(summary.factionId) &&
        (summary.playerId === null || allowedPlayerIds.has(summary.playerId))
    ),
    llmNarrative: {
      ...resolution.llmNarrative,
      privateUpdates: resolution.llmNarrative.privateUpdates.filter((update) =>
        allowedFactionIds.has(update.factionId)
      )
    }
  };
}

function projectAdvisorAnswersForScope(
  advisorAnswers: AdvisorAnswer[],
  scope: SessionProjectionScope
): AdvisorAnswer[] {
  if (scope.kind === "system") {
    return advisorAnswers;
  }

  if (scope.kind === "public") {
    return [];
  }

  const allowedFactionIds = new Set(scope.factionIds);

  return advisorAnswers.filter(
    (answer) =>
      answer.perspectiveFactionId === null ||
      allowedFactionIds.has(answer.perspectiveFactionId)
  );
}

function projectPrivateStateForScope(
  session: Game,
  scope: SessionProjectionScope
) {
  if (scope.kind === "system") {
    return session.state.privateByPlayer;
  }

  if (scope.kind === "public") {
    return [];
  }

  const allowedPlayerIds = new Set(scope.playerIds);
  const allowedFactionIds = new Set(scope.factionIds);

  return session.state.privateByPlayer.filter(
    (state) =>
      allowedPlayerIds.has(state.playerId) ||
      allowedFactionIds.has(state.factionId)
  );
}

function projectDerivedStateForScope(
  session: Game,
  scope: SessionProjectionScope,
  privateByPlayer: Game["state"]["privateByPlayer"]
) {
  if (scope.kind === "system") {
    return session.state.derived;
  }

  const visibleOptionIds = new Set(
    privateByPlayer.flatMap((state) => state.availableOptions.map((option) => option.id))
  );

  if (scope.kind === "public") {
    return {
      ...session.state.derived,
      actingPlayerIds: [],
      legalActionIds: [],
      recommendedActionIds: []
    };
  }

  const allowedPlayerIds = new Set(scope.playerIds);

  return {
    ...session.state.derived,
    actingPlayerIds: session.state.derived.actingPlayerIds.filter((playerId) =>
      allowedPlayerIds.has(playerId)
    ),
    legalActionIds: session.state.derived.legalActionIds.filter((actionId) =>
      visibleOptionIds.has(actionId)
    ),
    recommendedActionIds: session.state.derived.recommendedActionIds.filter((actionId) =>
      visibleOptionIds.has(actionId)
    )
  };
}

export function projectSessionForSelection(
  session: Game,
  selection: SessionViewSelection = {}
): Game {
  const canonicalSession = gameSchema.parse(session);
  const scope = resolveSessionProjectionScope(canonicalSession, selection);

  if (scope.kind === "system") {
    return canonicalSession;
  }

  const privateByPlayer = projectPrivateStateForScope(canonicalSession, scope);

  return gameSchema.parse({
    ...canonicalSession,
    state: {
      public: canonicalSession.state.public,
      privateByPlayer,
      derived: projectDerivedStateForScope(canonicalSession, scope, privateByPlayer)
    },
    advisorAnswers: projectAdvisorAnswersForScope(canonicalSession.advisorAnswers, scope),
    lastResolution: projectResolutionForScope(canonicalSession.lastResolution, scope)
  });
}

export function buildAdvisorVisibleContext(
  session: Game,
  selection: SessionViewSelection = {}
): AdvisorVisibleContext | null {
  const scope = resolveSessionProjectionScope(session, {
    ...selection,
    view: "faction"
  });

  if (scope.kind !== "faction") {
    return null;
  }

  const projected = projectSessionForSelection(session, {
    ...selection,
    view: "faction"
  });
  const focalPlayerId = selection.playerId ?? scope.playerIds[0];
  const focalPrivateStates = focalPlayerId
    ? projected.state.privateByPlayer.filter((state) => state.playerId === focalPlayerId)
    : projected.state.privateByPlayer;
  const visibleOptions = uniqueOptionsById(
    focalPrivateStates.flatMap((state) => state.availableOptions)
  );
  const lastAdvisorAnswer = projected.advisorAnswers.at(-1) ?? null;

  return {
    gameId: projected.id,
    turnNumber: projected.turnNumber,
    factionId: selection.factionId ?? scope.factionIds[0] ?? null,
    playerId: focalPlayerId,
    publicState: projected.state.public,
    visibleOptions,
    visibleWarnings: projected.state.derived.warnings,
    lastAdvisorAnswer
  };
}
