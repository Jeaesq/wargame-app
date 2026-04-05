import test from "node:test";
import assert from "node:assert/strict";
import {
  advisorAnswerSchema,
  turnResolutionResponseSchema
} from "@wargame/shared";
import {
  createHeadToHeadGame,
  createSeededSoloGame,
  createSoloGame,
  defaultTestUserId
} from "./test-support/app-test-helpers.js";

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
  assert.equal(
    answer.rationale.some((line) => /measured resolve|visible doctrine/i.test(line)),
    true
  );
  assert.equal(
    answer.rationale.some((line) => /opposing posture|coercive leverage/i.test(line)),
    true
  );
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

test("seeded advisor flow stays aligned with current visible options after multiple solo rounds", async () => {
  const { services, game: createdGame } = await createSeededSoloGame("berlin-phase7-advisor-visibility");
  const actingPlayer = createdGame.players.find((player) => player.role === "human");
  assert.ok(actingPlayer);

  const submission = turnResolutionResponseSchema.parse(
    await services.turnSubmissionService.submitTurn(createdGame.id, defaultTestUserId, {
      playerId: actingPlayer.id,
      factionId: actingPlayer.factionId ?? "faction-usa",
      optionId: "option-usa-airlift",
      declaredIntent: "Phase 7 advisor visibility continuity check.",
      parameters: {},
      clientContext: {
        source: "phase7-advisor-visibility"
      }
    })
  );
  const currentGame = submission.game;

  const currentHumanState = currentGame.state.privateByPlayer.find(
    (state) => state.playerId === actingPlayer.id
  );
  assert.ok(currentHumanState);

  const visibleOptionIds = new Set(currentHumanState.availableOptions.map((option) => option.id));
  assert.ok(visibleOptionIds.size > 0);
  assert.equal(visibleOptionIds.has("option-usa-airlift"), false);

  const answer = advisorAnswerSchema.parse(
    await services.advisorQaService.askQuestion({
      sessionId: currentGame.id,
      requestUserId: defaultTestUserId,
      playerId: actingPlayer.id,
      factionId: actingPlayer.factionId,
      question: "What should we do next this round?"
    })
  );

  assert.equal(answer.gameId, currentGame.id);
  assert.equal(answer.turnNumber, currentGame.turnNumber);
  assert.ok(answer.recommendedOptionIds.length >= 1);
  assert.ok(
    answer.recommendedOptionIds.every((optionId) => visibleOptionIds.has(optionId))
  );
  assert.ok(
    answer.assumptions.every((line) => !/secret|classified|unseen|opponent private/i.test(line))
  );
});
