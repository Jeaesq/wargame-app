import { gameSchema, type Game, type GameMode, type ScenarioDefinition } from "@wargame/shared";
import { randomUUID } from "node:crypto";
import { ValidationError } from "../errors/app-error.js";

type RequestedPlayer = {
  name: string;
  role: "human" | "ai" | "observer";
  factionId?: string;
};

type BuildGameFromScenarioInput = {
  now: string;
  scenario: ScenarioDefinition;
  mode: GameMode;
  requestedPlayers: RequestedPlayer[];
  targetGameLength: "short" | "medium" | "long";
};

export function buildGameFromScenario(input: BuildGameFromScenarioInput): Game {
  const { now, mode, requestedPlayers, scenario, targetGameLength } = input;
  const playableFactions = scenario.factions.filter((faction) => faction.isPlayable);

  if (playableFactions.length === 0) {
    throw new ValidationError("Scenario does not expose any playable factions.");
  }

  if (mode === "head_to_head" && requestedPlayers.length !== 2) {
    throw new ValidationError("Head-to-head mode requires exactly two players.");
  }

  if (mode === "solo" && requestedPlayers.length !== 1) {
    throw new ValidationError("Solo mode requires exactly one human-controlled player.");
  }

  const assignedFactionIds = new Set<string>();
  const players = requestedPlayers.map((player, index) => {
    const fallbackFaction = playableFactions[index];
    const factionId = player.factionId ?? fallbackFaction?.id ?? null;

    if (!factionId) {
      throw new ValidationError("Not enough playable factions are available for the requested players.");
    }

    if (assignedFactionIds.has(factionId)) {
      throw new ValidationError(`Faction ${factionId} cannot be assigned to multiple players.`);
    }

    assignedFactionIds.add(factionId);

    return {
      id: randomUUID(),
      gameId: "",
      name: player.name,
      role: player.role,
      factionId,
      seat: index,
      isActive: true,
      createdAt: now,
      metadata: {}
    };
  });

  if (mode === "solo") {
    const remainingFactions = playableFactions.filter(
      (faction) => !assignedFactionIds.has(faction.id)
    );

    for (const [index, faction] of remainingFactions.entries()) {
      players.push({
        id: randomUUID(),
        gameId: "",
        name: `${faction.name} AI`,
        role: "ai",
        factionId: faction.id,
        seat: requestedPlayers.length + index,
        isActive: true,
        createdAt: now,
        metadata: {
          generated: true
        }
      });
    }
  }

  const gameId = randomUUID();
  const currentFactionId = players.find((player) => player.factionId)?.factionId ?? null;
  const availableOptions = scenario.openingState.initialOptions.filter(
    (option) => option.factionId === currentFactionId
  );

  const privatePlayerStates = players
    .filter((player) => player.factionId)
    .map((player) => {
      const template =
        scenario.openingState.privateStates.find(
          (state) => state.factionId === player.factionId
        ) ?? {
          factionId: player.factionId,
          privateBriefing: "",
          intelligence: [],
          hiddenTracks: {},
          secretFlags: [],
          availableOptions: [],
          metadata: {}
        };

      return {
        ...template,
        gameId,
        playerId: player.id,
        turnNumber: scenario.startingTurn,
        availableOptions:
          player.factionId === currentFactionId ? availableOptions : []
      };
    });

  return gameSchema.parse({
    id: gameId,
    scenarioId: scenario.id,
    mode,
    status: "in_progress",
    turnNumber: scenario.startingTurn,
    phase: scenario.openingState.publicState.phase,
    currentFactionId,
    players: players.map((player) => ({
      ...player,
      gameId
    })),
    factions: scenario.factions,
    state: {
      public: {
        ...scenario.openingState.publicState,
        gameId,
        turnNumber: scenario.startingTurn,
        activeFactionId: currentFactionId,
        updatedAt: now
      },
      privateByPlayer: privatePlayerStates,
      derived: {
        ...scenario.openingState.derivedState,
        gameId,
        turnNumber: scenario.startingTurn,
        actingPlayerIds: players
          .filter((player) => player.factionId === currentFactionId)
          .map((player) => player.id),
        legalActionIds: availableOptions.map((option) => option.id),
        recommendedActionIds: availableOptions
          .filter((option) => (option.recommendationPercent ?? 0) >= 60)
          .map((option) => option.id)
      }
    },
    advisorAnswers: [],
    lastResolution: null,
    createdAt: now,
    updatedAt: now,
    sessionConfig: {
      targetGameLength
    },
    metadata: {
      scenarioSlug: scenario.slug
    }
  });
}
