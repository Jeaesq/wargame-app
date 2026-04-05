import test from "node:test";
import assert from "node:assert/strict";
import {
  turnResolutionResponseSchema,
  turnsListResponseSchema,
  type CreateTurnRequest
} from "@wargame/shared";
import {
  createHeadToHeadGame,
  createSeededSoloGame,
  createServices,
  createSoloGame,
  createSuezSoloGame,
  defaultTestUserId
} from "./test-support/app-test-helpers.js";

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

test("seeded solo sessions keep bot follow-ups and next-round legal options aligned across identical runs", async () => {
  const seed = "cold-war-replay-002";
  const [{ services: servicesA, game: gameA }, { services: servicesB, game: gameB }] =
    await Promise.all([createSeededSoloGame(seed), createSeededSoloGame(seed)]);
  const humanPlayerA = gameA.players.find((player) => player.role === "human");
  const humanPlayerB = gameB.players.find((player) => player.role === "human");
  assert.ok(humanPlayerA);
  assert.ok(humanPlayerB);

  const firstSubmissionA = turnResolutionResponseSchema.parse(
    await servicesA.turnSubmissionService.submitTurn(gameA.id, defaultTestUserId, {
      playerId: humanPlayerA.id,
      factionId: humanPlayerA.factionId ?? "faction-usa",
      optionId: "option-usa-airlift",
      declaredIntent: "Hold the line while preserving flexibility.",
      parameters: {},
      clientContext: {
        source: "seeded-alignment-test"
      }
    })
  );
  const firstSubmissionB = turnResolutionResponseSchema.parse(
    await servicesB.turnSubmissionService.submitTurn(gameB.id, defaultTestUserId, {
      playerId: humanPlayerB.id,
      factionId: humanPlayerB.factionId ?? "faction-usa",
      optionId: "option-usa-airlift",
      declaredIntent: "Hold the line while preserving flexibility.",
      parameters: {},
      clientContext: {
        source: "seeded-alignment-test"
      }
    })
  );

  assert.equal(firstSubmissionA.followupResolutions.length, 1);
  assert.equal(firstSubmissionB.followupResolutions.length, 1);
  assert.equal(firstSubmissionA.followupResolutions[0]?.actor.playerRole, "ai");
  assert.equal(firstSubmissionB.followupResolutions[0]?.actor.playerRole, "ai");
  assert.equal(
    firstSubmissionA.followupResolutions[0]?.appliedOptionId,
    firstSubmissionB.followupResolutions[0]?.appliedOptionId
  );

  const nextHumanStateA = firstSubmissionA.game.state.privateByPlayer.find(
    (state) => state.playerId === humanPlayerA.id
  );
  const nextHumanStateB = firstSubmissionB.game.state.privateByPlayer.find(
    (state) => state.playerId === humanPlayerB.id
  );
  assert.ok(nextHumanStateA);
  assert.ok(nextHumanStateB);

  const nextOptionIdsA = [...nextHumanStateA.availableOptions.map((option) => option.id)].sort();
  const nextOptionIdsB = [...nextHumanStateB.availableOptions.map((option) => option.id)].sort();

  assert.deepEqual(nextOptionIdsA, nextOptionIdsB);
  assert.deepEqual(
    nextOptionIdsA,
    [...firstSubmissionA.game.state.derived.legalActionIds].sort()
  );
  assert.deepEqual(
    nextOptionIdsB,
    [...firstSubmissionB.game.state.derived.legalActionIds].sort()
  );
  assert.equal(nextOptionIdsA.includes("option-usa-airlift-harden"), true);

  const secondSubmissionA = turnResolutionResponseSchema.parse(
    await servicesA.turnSubmissionService.submitTurn(
      firstSubmissionA.game.id,
      defaultTestUserId,
      {
        playerId: humanPlayerA.id,
        factionId: humanPlayerA.factionId ?? "faction-usa",
        optionId: "option-usa-airlift-harden",
        declaredIntent: "Lock in the airlift posture without widening the crisis.",
        parameters: {},
        clientContext: {
          source: "seeded-alignment-test"
        }
      }
    )
  );
  const secondSubmissionB = turnResolutionResponseSchema.parse(
    await servicesB.turnSubmissionService.submitTurn(
      firstSubmissionB.game.id,
      defaultTestUserId,
      {
        playerId: humanPlayerB.id,
        factionId: humanPlayerB.factionId ?? "faction-usa",
        optionId: "option-usa-airlift-harden",
        declaredIntent: "Lock in the airlift posture without widening the crisis.",
        parameters: {},
        clientContext: {
          source: "seeded-alignment-test"
        }
      }
    )
  );

  assert.equal(
    secondSubmissionA.followupResolutions[0]?.appliedOptionId,
    secondSubmissionB.followupResolutions[0]?.appliedOptionId
  );

  const roundTwoHumanStateA = secondSubmissionA.game.state.privateByPlayer.find(
    (state) => state.playerId === humanPlayerA.id
  );
  const roundTwoHumanStateB = secondSubmissionB.game.state.privateByPlayer.find(
    (state) => state.playerId === humanPlayerB.id
  );
  assert.ok(roundTwoHumanStateA);
  assert.ok(roundTwoHumanStateB);

  assert.deepEqual(
    [...roundTwoHumanStateA.availableOptions.map((option) => option.id)].sort(),
    [...secondSubmissionA.game.state.derived.legalActionIds].sort()
  );
  assert.deepEqual(
    [...roundTwoHumanStateB.availableOptions.map((option) => option.id)].sort(),
    [...secondSubmissionB.game.state.derived.legalActionIds].sort()
  );
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
  assert.match(nextHumanState.privateBriefing, /now faces the next decision window/i);
  assert.match(nextHumanState.privateBriefing, /measured resolve/i);
  assert.equal(
    nextHumanState.intelligence.some((line) => /Placeholder intelligence/i.test(line)),
    false
  );
  assert.equal(
    nextHumanState.intelligence.some((line) => /Your doctrine favors measured resolve/i.test(line)),
    true
  );
  assert.equal(
    submission.game.state.public.revealedEvents.includes("berlin-airlift-symbolism-surges"),
    true
  );
  assert.equal(
    submission.game.state.derived.warnings.some((warning) =>
      /airlift is becoming a wider symbol of resolve/i.test(warning)
    ),
    true
  );
  assert.ok(
    (submission.game.state.public.visibleTracks.globalAttention ?? 0) >
      (createdGame.state.public.visibleTracks.globalAttention ?? 0)
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
