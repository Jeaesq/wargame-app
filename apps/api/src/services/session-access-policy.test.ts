import assert from "node:assert/strict";
import test from "node:test";
import {
  canUserAccessGame,
  getPlayerAssignmentStatus,
  getUserSessionAccessRole,
  isPlayerClaimableByUser,
  listPlayersControlledByUser,
  type Game
} from "@wargame/shared";

const baseGame: Game = {
  id: "game-1",
  scenarioId: "scenario-1",
  ownerUserId: "owner-user",
  mode: "head_to_head",
  status: "in_progress",
  turnNumber: 1,
  phase: "planning",
  currentFactionId: "faction-1",
  players: [
    {
      id: "player-1",
      gameId: "game-1",
      name: "Owner",
      role: "human",
      userId: "owner-user",
      factionId: "faction-1",
      seat: 0,
      isActive: true,
      createdAt: "2026-03-29T00:00:00.000Z",
      metadata: {}
    },
    {
      id: "player-2",
      gameId: "game-1",
      name: "Open Seat",
      role: "human",
      userId: null,
      factionId: "faction-2",
      seat: 1,
      isActive: true,
      createdAt: "2026-03-29T00:00:00.000Z",
      metadata: {}
    },
    {
      id: "player-3",
      gameId: "game-1",
      name: "AI Seat",
      role: "ai",
      userId: null,
      factionId: "faction-3",
      seat: 2,
      isActive: true,
      createdAt: "2026-03-29T00:00:00.000Z",
      metadata: {}
    }
  ],
  factions: [
    {
      id: "faction-1",
      scenarioId: "scenario-1",
      slug: "alpha",
      name: "Alpha",
      role: "major_power",
      description: "Alpha faction",
      doctrineSummary: "Alpha doctrine",
      publicTraits: [],
      privateTraits: [],
      isPlayable: true,
      metadata: {}
    },
    {
      id: "faction-2",
      scenarioId: "scenario-1",
      slug: "beta",
      name: "Beta",
      role: "major_power",
      description: "Beta faction",
      doctrineSummary: "Beta doctrine",
      publicTraits: [],
      privateTraits: [],
      isPlayable: true,
      metadata: {}
    },
    {
      id: "faction-3",
      scenarioId: "scenario-1",
      slug: "gamma",
      name: "Gamma",
      role: "regional_power",
      description: "Gamma faction",
      doctrineSummary: "Gamma doctrine",
      publicTraits: [],
      privateTraits: [],
      isPlayable: true,
      metadata: {}
    }
  ],
  state: {
    public: {
      gameId: "game-1",
      scenarioId: "scenario-1",
      turnNumber: 1,
      activeFactionId: "faction-1",
      phase: "planning",
      worldTension: 40,
      publicNarrative: "Opening turn.",
      visibleTracks: {},
      publicFlags: [],
      revealedEvents: [],
      updatedAt: "2026-03-29T00:00:00.000Z",
      metadata: {}
    },
    privateByPlayer: [],
    derived: {
      gameId: "game-1",
      turnNumber: 1,
      actingPlayerIds: ["player-1"],
      legalActionIds: [],
      recommendedActionIds: [],
      escalationRiskPercent: 30,
      negotiationLeverage: {},
      factionMomentum: {},
      warnings: [],
      metadata: {}
    }
  },
  advisorAnswers: [],
  lastResolution: null,
  createdAt: "2026-03-29T00:00:00.000Z",
  updatedAt: "2026-03-29T00:00:00.000Z",
  sessionConfig: {
    targetGameLength: "medium"
  },
  metadata: {}
};

test("session access helpers distinguish current controllers from future claimable seats", () => {
  assert.equal(getUserSessionAccessRole(baseGame, "owner-user"), "owner");
  assert.equal(getUserSessionAccessRole(baseGame, "outsider-user"), "none");
  assert.equal(canUserAccessGame(baseGame, "owner-user"), true);
  assert.equal(canUserAccessGame(baseGame, "outsider-user"), false);
  assert.deepEqual(
    listPlayersControlledByUser(baseGame, "owner-user").map((player) => player.id),
    ["player-1"]
  );
  assert.equal(getPlayerAssignmentStatus(baseGame.players[1]!), "open_human");
  assert.equal(isPlayerClaimableByUser(baseGame.players[1]!), true);
  assert.equal(getPlayerAssignmentStatus(baseGame.players[2]!), "ai_controlled");
});
