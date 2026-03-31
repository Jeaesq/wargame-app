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
  identity: {
    userIdHeader: "x-wargame-user-id",
    userNameHeader: "x-wargame-user-name",
    defaultUserId: "local-dev-user"
  },
  providers: {
    advisor: "mock",
    turn: "mock",
    bot: "mock",
    openai: null
  },
  database: null
};

function createServices() {
  return createApiServices(testConfig);
}

const defaultTestUserId = "local-dev-user";

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

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}

async function createSeededSoloGame(seed: string) {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-cold-war-berlin-mvp",
    mode: "solo",
    targetGameLength: "medium",
    debug: {
      deterministicMode: true,
      seed
    },
    players: [
      {
        name: "Player One",
        role: "human",
        factionId: "faction-usa"
      }
    ]
  };

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}

async function createHeadToHeadGame() {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-cold-war-berlin-mvp",
    mode: "head_to_head",
    targetGameLength: "medium",
    players: [
      {
        name: "Player USA",
        role: "human",
        factionId: "faction-usa"
      },
      {
        name: "Player USSR",
        role: "human",
        factionId: "faction-ussr"
      }
    ]
  };

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}

async function createSuezSoloGame() {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: "scenario-suez-crisis-mvp",
    mode: "solo",
    targetGameLength: "medium",
    players: [
      {
        name: "Canal Player",
        role: "human",
        factionId: "faction-anglo-french"
      }
    ]
  };

  const game = await services.gameSessionService.createSession(
    createPayload,
    defaultTestUserId
  );

  return {
    services,
    game: gameSchema.parse(game)
  };
}

test("create session and load session overview", async () => {
  const { services, game: createdGame } = await createSoloGame();

  assert.equal(createdGame.sessionConfig.targetGameLength, "medium");
  assert.equal(createdGame.sessionConfig.debug.mode, "off");
  assert.equal(createdGame.ownerUserId, defaultTestUserId);
  assert.equal(createdGame.turnNumber, 1);
  assert.equal(createdGame.mode, "solo");
  assert.equal(createdGame.progression.model, "solo_round");
  assert.equal(createdGame.progression.currentRoundActionIndex, 1);
  assert.equal(createdGame.progression.roundActionCount, 2);

  const listedGames = await services.gameSessionService.listSessions(defaultTestUserId);
  assert.equal(listedGames.length, 1);
  assert.equal(listedGames[0]?.state.privateByPlayer.length, 0);

  const loadedGame = await services.gameSessionService.getSession(
    createdGame.id,
    defaultTestUserId
  );

  assert.equal(loadedGame.id, createdGame.id);
  assert.equal(loadedGame.state.public.headline, createdGame.state.public.headline);
  assert.equal(
    loadedGame.state.privateByPlayer.some(
      (state) => state.factionId === "faction-usa" && state.availableOptions.length > 0
    ),
    true
  );
});

test("seeded debug sessions reproduce ids and counters across identical runs", async () => {
  const seed = "cold-war-replay-001";
  const [{ services: servicesA, game: gameA }, { services: servicesB, game: gameB }] =
    await Promise.all([createSeededSoloGame(seed), createSeededSoloGame(seed)]);

  assert.equal(gameA.sessionConfig.debug.mode, "seeded");
  assert.equal(gameA.sessionConfig.debug.seed, seed);
  assert.equal(gameA.id, gameB.id);
  assert.deepEqual(
    gameA.players.map((player) => player.id),
    gameB.players.map((player) => player.id)
  );
  assert.deepEqual(gameA.sessionConfig.debug.streamCounters, {
    player: 2,
    game: 1
  });

  const humanPlayerA = gameA.players.find((player) => player.role === "human");
  const humanPlayerB = gameB.players.find((player) => player.role === "human");
  assert.ok(humanPlayerA);
  assert.ok(humanPlayerB);

  const [answerA, answerB] = await Promise.all([
    servicesA.advisorQaService.askQuestion({
      sessionId: gameA.id,
      requestUserId: defaultTestUserId,
      playerId: humanPlayerA.id,
      factionId: humanPlayerA.factionId,
      question: "What matters most right now?"
    }),
    servicesB.advisorQaService.askQuestion({
      sessionId: gameB.id,
      requestUserId: defaultTestUserId,
      playerId: humanPlayerB.id,
      factionId: humanPlayerB.factionId,
      question: "What matters most right now?"
    })
  ]);

  assert.equal(answerA.answerId, answerB.answerId);

  const [submissionA, submissionB] = await Promise.all([
    servicesA.turnSubmissionService.submitTurn(gameA.id, defaultTestUserId, {
      playerId: humanPlayerA.id,
      factionId: humanPlayerA.factionId ?? "faction-usa",
      optionId: "option-usa-airlift",
      declaredIntent: "Demonstrate resolve without ground escalation.",
      parameters: {},
      clientContext: {
        source: "seeded-test"
      }
    }),
    servicesB.turnSubmissionService.submitTurn(gameB.id, defaultTestUserId, {
      playerId: humanPlayerB.id,
      factionId: humanPlayerB.factionId ?? "faction-usa",
      optionId: "option-usa-airlift",
      declaredIntent: "Demonstrate resolve without ground escalation.",
      parameters: {},
      clientContext: {
        source: "seeded-test"
      }
    })
  ]);

  assert.equal(submissionA.resolution.actionId, submissionB.resolution.actionId);
  assert.equal(submissionA.resolution.id, submissionB.resolution.id);
  assert.equal(
    submissionA.followupResolutions[0]?.actionId,
    submissionB.followupResolutions[0]?.actionId
  );
  assert.equal(
    submissionA.followupResolutions[0]?.id,
    submissionB.followupResolutions[0]?.id
  );
  assert.deepEqual(submissionA.game.sessionConfig.debug.streamCounters, {
    player: 2,
    game: 1,
    "advisor-answer": 1,
    "turn-action": 2,
    "turn-resolution": 2
  });
});

test("session retrieval projects public and faction-private views explicitly", async () => {
  const { services, game } = await createHeadToHeadGame();
  const usaPlayer = game.players.find((player) => player.factionId === "faction-usa");
  assert.ok(usaPlayer);

  const defaultView = await services.gameSessionService.getSession(
    game.id,
    defaultTestUserId
  );
  assert.equal(defaultView.state.privateByPlayer.length, 0);
  assert.equal(defaultView.state.derived.legalActionIds.length, 0);
  assert.equal(defaultView.advisorAnswers.length, 0);

  const usaViewWithIdentity = await services.gameSessionService.getSession(
    game.id,
    defaultTestUserId,
    {
      playerId: usaPlayer.id,
      factionId: usaPlayer.factionId
    }
  );

  assert.equal(usaViewWithIdentity.state.privateByPlayer.length, 1);
  assert.equal(usaViewWithIdentity.state.privateByPlayer[0]?.factionId, "faction-usa");
  assert.ok(usaViewWithIdentity.state.privateByPlayer[0]?.availableOptions.length);
  assert.ok(usaViewWithIdentity.state.derived.legalActionIds.length > 0);
});

test("scenario catalog supports multiple playable scenarios and initializes Suez cleanly", async () => {
  const { services, game } = await createSuezSoloGame();
  const scenarios = await services.scenarioRepository.listScenarios();

  assert.ok(
    scenarios.some((scenario) => scenario.id === "scenario-cold-war-berlin-mvp")
  );
  assert.ok(
    scenarios.some((scenario) => scenario.id === "scenario-suez-crisis-mvp")
  );
  assert.equal(game.scenarioId, "scenario-suez-crisis-mvp");
  assert.match(game.state.public.headline ?? "", /Suez/i);
  assert.equal(game.factions.some((faction) => faction.id === "faction-egypt"), true);
  assert.equal(
    game.state.privateByPlayer[0]?.availableOptions.every(
      (option) => option.scenarioId === "scenario-suez-crisis-mvp"
    ),
    true
  );
  assert.ok(
    game.state.privateByPlayer[0]?.availableOptions.some(
      (option) => option.id === "option-coalition-airborne-plan"
    )
  );
});

test("session creation rejects faction ids that do not belong to the selected scenario", async () => {
  const services = createServices();

  await assert.rejects(
    () =>
      services.gameSessionService.createSession(
        {
          scenarioId: "scenario-suez-crisis-mvp",
          mode: "solo",
          targetGameLength: "medium",
          players: [
            {
              name: "Player One",
              role: "human",
              factionId: "faction-usa"
            }
          ]
        },
        defaultTestUserId
      ),
    /not playable in scenario/i
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
    await services.turnSubmissionService.submitTurn(
      createdGame.id,
      defaultTestUserId,
      submitPayload
    )
  );

  assert.equal(submission.resolution.actor.playerRole, "human");
  assert.equal(submission.resolution.turnNumber, 1);
  assert.equal(submission.resolution.progression.roundActionIndex, 1);
  assert.equal(submission.resolution.progression.roundActionCount, 2);
  assert.equal(submission.resolution.progression.advancesRound, false);
  assert.equal(submission.followupResolutions.length, 1);
  assert.equal(submission.followupResolutions[0]?.actor.playerRole, "ai");
  assert.equal(submission.followupResolutions[0]?.turnNumber, 1);
  assert.equal(submission.followupResolutions[0]?.progression.roundActionIndex, 2);
  assert.equal(submission.followupResolutions[0]?.progression.advancesRound, true);
  assert.equal(submission.game.turnNumber, 2);
  assert.equal(submission.game.progression.currentRound, 2);
  assert.equal(submission.game.progression.completedRoundCount, 1);
  const nextHumanState = submission.game.state.privateByPlayer.find(
    (state) => state.factionId === "faction-usa"
  );
  assert.ok(nextHumanState);
  assert.equal(
    nextHumanState.availableOptions.some((option) => option.id === "option-usa-airlift"),
    false
  );
  assert.equal(
    nextHumanState.availableOptions.some((option) => option.id === "option-usa-airlift-harden"),
    true
  );
  assert.equal(
    nextHumanState.availableOptions.some(
      (option) =>
        option.id === "option-usa-airlift-harden" &&
        option.metadata.generatedFromOptionId === "option-usa-airlift-followup-template"
    ),
    true
  );
  assert.ok(submission.game.lastResolution);
  assert.equal(submission.game.lastResolution?.actor.playerRole, "ai");

  const turnHistory = turnsListResponseSchema.parse({
    turns: await services.turnSubmissionService.listTurns(createdGame.id)
  });

  assert.equal(turnHistory.turns.length, 2);
  assert.equal(turnHistory.turns[0]?.actor.playerRole, "human");
  assert.equal(turnHistory.turns[1]?.actor.playerRole, "ai");
  assert.equal(turnHistory.turns[0]?.turnNumber, 1);
  assert.equal(turnHistory.turns[1]?.turnNumber, 1);
  assert.equal(turnHistory.turns[1]?.actingFactionId, "faction-ussr");

  const reloadedGame = await services.gameSessionService.getSession(
    createdGame.id,
    defaultTestUserId
  );

  assert.equal(reloadedGame.turnNumber, 2);
  assert.equal(reloadedGame.progression.currentRound, 2);
  assert.equal(reloadedGame.progression.completedRoundCount, 1);
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
      requestUserId: defaultTestUserId,
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

test("advisor flow uses faction-visible state when multiple human factions exist", async () => {
  const { services, game } = await createHeadToHeadGame();
  const ussrPlayer = game.players.find((player) => player.factionId === "faction-ussr");
  assert.ok(ussrPlayer);

  const answer = advisorAnswerSchema.parse(
    await services.advisorQaService.askQuestion({
      sessionId: game.id,
      requestUserId: defaultTestUserId,
      playerId: ussrPlayer.id,
      factionId: ussrPlayer.factionId,
      question: "What should we do next?"
    })
  );

  assert.equal(answer.perspectiveFactionId, "faction-ussr");
  assert.ok(
    answer.recommendedOptionIds.every((optionId) => optionId.startsWith("option-ussr"))
  );
});

test("session ownership restricts access to non-participant users", async () => {
  const { services, game } = await createSoloGame();

  const listedGames = await services.gameSessionService.listSessions("other-user");
  assert.equal(listedGames.length, 0);

  await assert.rejects(
    () => services.gameSessionService.getSession(game.id, "other-user"),
    /cannot access game/i
  );

  await assert.rejects(
    () =>
      services.turnSubmissionService.submitTurn(game.id, "other-user", {
        playerId: game.players[0]!.id,
        factionId: game.players[0]!.factionId ?? "faction-usa",
        optionId: "option-usa-airlift",
        parameters: {},
        clientContext: {}
      }),
    /cannot access game|cannot submit turns/i
  );
});
