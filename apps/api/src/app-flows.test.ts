import test from "node:test";
import assert from "node:assert/strict";
import {
  turnResolutionResponseSchema,
  turnsListResponseSchema
} from "@wargame/shared";
import {
  createSeededSoloGame,
  createSeededSuezSoloGame,
  createShortSuezSoloGame,
  defaultTestUserId
} from "./test-support/app-test-helpers.js";

test("seeded Berlin solo flow escalates through the checkpoint faceoff branch into a resolved ending", async () => {
  const { services, game: createdGame } = await createSeededSoloGame("berlin-phase4-flow");
  const actingPlayer = createdGame.players.find((player) => player.role === "human");
  assert.ok(actingPlayer);

  let currentGame = createdGame;

  for (const optionId of ["option-usa-airlift", "option-usa-protest"]) {
    const submission = turnResolutionResponseSchema.parse(
      await services.turnSubmissionService.submitTurn(currentGame.id, defaultTestUserId, {
        playerId: actingPlayer.id,
        factionId: actingPlayer.factionId ?? "faction-usa",
        optionId,
        declaredIntent: "Phase 4 seeded Berlin flow.",
        parameters: {},
        clientContext: {
          source: "phase4-flow-test"
        }
      })
    );

    currentGame = submission.game;
  }

  assert.equal(currentGame.status, "completed");
  assert.equal(currentGame.turnNumber, 3);
  assert.equal(currentGame.progression.completedRoundCount, 2);
  assert.equal(currentGame.state.public.publicFlags.includes("checkpoint-faceoff-active"), true);
  assert.equal(
    currentGame.state.public.revealedEvents.includes("berlin-checkpoint-faceoff-intensifies"),
    true
  );
  assert.equal(currentGame.state.derived.outcome.status, "ended");
  assert.equal(currentGame.state.derived.outcome.category, "partial_success");
  assert.equal(currentGame.state.derived.outcome.winningFactionId, "faction-ussr");
  assert.ok(currentGame.state.derived.outcome.pressure.catastrophicRiskPercent >= 80);

  const turnHistory = turnsListResponseSchema.parse({
    turns: await services.turnSubmissionService.listTurns(currentGame.id)
  });

  assert.equal(turnHistory.turns.length, 4);
  assert.equal(
    turnHistory.turns.some((turn) =>
      (turn.metadata.triggeredScenarioEventIds as string[] | undefined)?.includes(
        "berlin-checkpoint-faceoff-intensifies"
      )
    ),
    true
  );
});

test("seeded Suez solo flow hardens the intervention window and reaches a catastrophic ending", async () => {
  const { services, game: createdGame } = await createSeededSuezSoloGame("suez-phase4-flow");
  const actingPlayer = createdGame.players.find((player) => player.role === "human");
  assert.ok(actingPlayer);

  let currentGame = createdGame;

  for (const optionId of [
    "option-coalition-ultimatum",
    "option-coalition-airborne-plan",
    "option-coalition-covert-liaison"
  ]) {
    const submission = turnResolutionResponseSchema.parse(
      await services.turnSubmissionService.submitTurn(currentGame.id, defaultTestUserId, {
        playerId: actingPlayer.id,
        factionId: actingPlayer.factionId ?? "faction-anglo-french",
        optionId,
        declaredIntent: "Phase 4 seeded Suez flow.",
        parameters: {},
        clientContext: {
          source: "phase4-flow-test"
        }
      })
    );

    currentGame = submission.game;
  }

  assert.equal(currentGame.status, "completed");
  assert.equal(currentGame.turnNumber, 4);
  assert.equal(currentGame.progression.completedRoundCount, 3);
  assert.equal(
    currentGame.state.public.publicFlags.includes("intervention-window-hardening"),
    true
  );
  assert.equal(
    currentGame.state.public.revealedEvents.includes("suez-intervention-window-hardens"),
    true
  );
  assert.equal(currentGame.state.derived.outcome.status, "ended");
  assert.equal(currentGame.state.derived.outcome.category, "catastrophic_escalation");
  assert.ok(currentGame.state.derived.outcome.pressure.catastrophicRiskPercent >= 85);

  const turnHistory = turnsListResponseSchema.parse({
    turns: await services.turnSubmissionService.listTurns(currentGame.id)
  });

  assert.equal(turnHistory.turns.length, 6);
  assert.equal(
    turnHistory.turns.some((turn) =>
      (turn.metadata.triggeredScenarioEventIds as string[] | undefined)?.includes(
        "suez-intervention-window-hardens"
      )
    ),
    true
  );
});

test("seeded Berlin solo flow can reach a credible de-escalation ending through backchannel play", async () => {
  const { services, game: createdGame } = await createSeededSoloGame("berlin-phase4-deescalation");
  const actingPlayer = createdGame.players.find((player) => player.role === "human");
  assert.ok(actingPlayer);

  let currentGame = createdGame;

  for (const optionId of [
    "option-usa-backchannel",
    "option-usa-alliance-summit",
    "option-usa-backchannel"
  ]) {
    const submission = turnResolutionResponseSchema.parse(
      await services.turnSubmissionService.submitTurn(currentGame.id, defaultTestUserId, {
        playerId: actingPlayer.id,
        factionId: actingPlayer.factionId ?? "faction-usa",
        optionId,
        declaredIntent: "Phase 4 seeded Berlin de-escalation flow.",
        parameters: {},
        clientContext: {
          source: "phase4-flow-test"
        }
      })
    );

    currentGame = submission.game;

    if (currentGame.state.derived.outcome.status === "ended") {
      break;
    }
  }

  assert.equal(currentGame.status, "completed");
  assert.equal(currentGame.turnNumber, 3);
  assert.equal(currentGame.progression.completedRoundCount, 2);
  assert.equal(currentGame.state.derived.outcome.status, "ended");
  assert.equal(currentGame.state.derived.outcome.category, "crisis_deescalation");
  assert.equal(currentGame.state.derived.outcome.winningFactionId, null);
  assert.ok(currentGame.state.public.worldTension <= 45);
  assert.ok(currentGame.state.derived.escalationRiskPercent <= 25);
  assert.equal(currentGame.state.public.publicFlags.includes("quiet-channel-active"), true);
  assert.equal(currentGame.state.public.publicFlags.includes("allied-summit"), true);
  assert.equal(
    currentGame.state.public.revealedEvents.includes("private-overtures-reported"),
    true
  );

  const turnHistory = turnsListResponseSchema.parse({
    turns: await services.turnSubmissionService.listTurns(currentGame.id)
  });

  assert.equal(turnHistory.turns.length, 5);
  assert.equal(turnHistory.turns[4]?.actingFactionId, "faction-usa");
  assert.equal(turnHistory.turns[4]?.sessionOutcome?.category, "crisis_deescalation");
});

test("seeded Suez Egypt solo flow can converge diplomatic pressure into a strategic off-ramp win", async () => {
  const { services, game: createdGame } = await createSeededSuezSoloGame(
    "suez-phase4-egypt-offramp",
    "faction-egypt"
  );
  const actingPlayer = createdGame.players.find((player) => player.role === "human");
  assert.ok(actingPlayer);

  let currentGame = createdGame;

  for (const optionId of [
    "option-egypt-un-appeal",
    "option-egypt-radio-campaign",
    "option-egypt-superpower-mediation"
  ]) {
    const submission = turnResolutionResponseSchema.parse(
      await services.turnSubmissionService.submitTurn(currentGame.id, defaultTestUserId, {
        playerId: actingPlayer.id,
        factionId: actingPlayer.factionId ?? "faction-egypt",
        optionId,
        declaredIntent: "Phase 4 seeded Suez off-ramp flow.",
        parameters: {},
        clientContext: {
          source: "phase4-flow-test"
        }
      })
    );

    currentGame = submission.game;

    if (currentGame.state.derived.outcome.status === "ended") {
      break;
    }
  }

  assert.equal(currentGame.status, "completed");
  assert.equal(currentGame.turnNumber, 4);
  assert.equal(currentGame.progression.completedRoundCount, 3);
  assert.equal(currentGame.state.derived.outcome.status, "ended");
  assert.equal(currentGame.state.derived.outcome.category, "strategic_success");
  assert.equal(currentGame.state.derived.outcome.winningFactionId, "faction-egypt");
  assert.equal(currentGame.state.public.publicFlags.includes("ceasefire-channel-visible"), true);
  assert.equal(
    currentGame.state.public.publicFlags.includes("ceasefire-pressure-converged"),
    true
  );
  assert.equal(
    currentGame.state.public.revealedEvents.includes("suez-ceasefire-channel-opens"),
    true
  );
  assert.ok(currentGame.state.derived.outcome.pressure.deescalationOpportunityPercent >= 80);
  assert.ok(currentGame.state.derived.escalationRiskPercent <= 50);

  const turnHistory = turnsListResponseSchema.parse({
    turns: await services.turnSubmissionService.listTurns(currentGame.id)
  });

  assert.equal(turnHistory.turns.length, 6);
  assert.ok(
    turnHistory.turns.some(
      (turn) => ((turn.metadata.triggeredScenarioEventIds as string[] | undefined)?.length ?? 0) > 0
    )
  );
});

test("short Suez Egypt solo games still surface visible options by turn 4", async () => {
  const { services, game: createdGame } = await createShortSuezSoloGame("faction-egypt");
  let currentGame = createdGame;
  const actingPlayer = currentGame.players.find((player) => player.role === "human");
  assert.ok(actingPlayer);

  for (let step = 0; step < 3; step += 1) {
    const privateState = currentGame.state.privateByPlayer.find(
      (state) => state.playerId === actingPlayer.id
    );
    assert.ok(privateState);
    assert.ok(
      privateState.availableOptions.length > 0,
      `Expected Egypt to have visible options before step ${step + 1}.`
    );

    const optionId = privateState.availableOptions[0]!.id;
    const submission = turnResolutionResponseSchema.parse(
      await services.turnSubmissionService.submitTurn(currentGame.id, defaultTestUserId, {
        playerId: actingPlayer.id,
        factionId: actingPlayer.factionId ?? "faction-egypt",
        optionId,
        declaredIntent: "Phase 7 short Suez Egypt option continuity check.",
        parameters: {},
        clientContext: {
          source: "phase7-suez-option-continuity"
        }
      })
    );

    currentGame = submission.game;

    if (currentGame.state.derived.outcome.status === "ended") {
      break;
    }
  }

  const turnFourState = currentGame.state.privateByPlayer.find(
    (state) => state.playerId === actingPlayer.id
  );
  assert.ok(turnFourState);
  assert.ok(
    turnFourState.availableOptions.length > 0,
    "Expected Egypt to still have visible options available by turn 4 in a short Suez game."
  );
});
