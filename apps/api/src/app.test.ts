import test from "node:test";
import assert from "node:assert/strict";
import {
  advisorAnswerSchema,
  gameSchema,
  turnResolutionResponseSchema,
  turnsListResponseSchema,
  type CreateGameRequest,
  type CreateTurnRequest
} from "@wargame/shared";
import { createApiServices } from "./composition.js";
import type { AppConfig } from "./config.js";

const testConfig: AppConfig = {
  port: 0,
  persistence: {
    mode: "memory"
  },
  providers: {
    mode: "mock",
    openai: null
  },
  database: null
};

function createServices() {
  return createApiServices(testConfig);
}

async function createSoloGame() {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-cold-war-berlin-mvp",
    mode: "solo",
    targetGameLength: "medium",
    players: [
      {
        name: "Player One",
        role: "human",
        factionId: "faction-usa"
      }
    ]
  };

  const game = await services.gameSessionService.createSession(createPayload);

  return {
    services,
    game: gameSchema.parse(game)
  };
}

test("create session and load session overview", async () => {
  const { services, game: createdGame } = await createSoloGame();

  assert.equal(createdGame.sessionConfig.targetGameLength, "medium");
  assert.equal(createdGame.turnNumber, 1);
  assert.equal(createdGame.mode, "solo");

  const listedGames = await services.gameSessionService.listSessions();
  assert.equal(listedGames.length, 1);

  const loadedGame = await services.gameSessionService.getSession(createdGame.id);

  assert.equal(loadedGame.id, createdGame.id);
  assert.equal(loadedGame.state.public.headline, createdGame.state.public.headline);
  assert.equal(
    loadedGame.state.privateByPlayer.some(
      (state) => state.factionId === "faction-usa" && state.availableOptions.length > 0
    ),
    true
  );
});

test("submit turn persists human and bot resolutions and updates canonical state", async () => {
  const { services, game: createdGame } = await createSoloGame();
  const actingPlayer = createdGame.players.find((player) => player.role === "human");
  assert.ok(actingPlayer);

  const submitPayload: CreateTurnRequest = {
    playerId: actingPlayer.id,
    factionId: actingPlayer.factionId ?? "faction-usa",
    optionId: "option-usa-airlift",
    declaredIntent: "Demonstrate resolve without ground escalation.",
    parameters: {},
    clientContext: {
      source: "test"
    }
  };

  const submission = turnResolutionResponseSchema.parse(
    await services.turnSubmissionService.submitTurn(createdGame.id, submitPayload)
  );

  assert.equal(submission.resolution.actor.playerRole, "human");
  assert.equal(submission.followupResolutions.length, 1);
  assert.equal(submission.followupResolutions[0]?.actor.playerRole, "ai");
  assert.equal(submission.game.turnNumber, 3);
  assert.ok(submission.game.lastResolution);
  assert.equal(submission.game.lastResolution?.actor.playerRole, "ai");

  const turnHistory = turnsListResponseSchema.parse({
    turns: await services.turnSubmissionService.listTurns(createdGame.id)
  });

  assert.equal(turnHistory.turns.length, 2);
  assert.equal(turnHistory.turns[0]?.actor.playerRole, "human");
  assert.equal(turnHistory.turns[1]?.actor.playerRole, "ai");
  assert.equal(turnHistory.turns[1]?.actingFactionId, "faction-ussr");

  const reloadedGame = await services.gameSessionService.getSession(createdGame.id);

  assert.equal(reloadedGame.turnNumber, 3);
  assert.equal(reloadedGame.lastResolution?.actor.playerRole, "ai");
  assert.ok(reloadedGame.state.public.worldTension > createdGame.state.public.worldTension);
});

test("advisor flow returns a validated visible-state answer contract", async () => {
  const { services, game: createdGame } = await createSoloGame();
  const actingPlayer = createdGame.players.find((player) => player.role === "human");
  assert.ok(actingPlayer);

  const answer = advisorAnswerSchema.parse(
    await services.advisorQaService.askQuestion({
      sessionId: createdGame.id,
      playerId: actingPlayer.id,
      factionId: actingPlayer.factionId,
      question: "What is the risk if we escalate now?"
    })
  );

  assert.equal(answer.gameId, createdGame.id);
  assert.equal(answer.turnNumber, 1);
  assert.equal(answer.perspectiveFactionId, "faction-usa");
  assert.ok(answer.shortAnswer.length > 0);
  assert.ok(answer.rationale.length >= 1);
  assert.match(answer.metadata.provider as string, /advisor/i);
});
