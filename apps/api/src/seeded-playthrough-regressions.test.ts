import assert from "node:assert/strict";
import test from "node:test";
import {
  gameSchema,
  turnResolutionResponseSchema,
  turnsListResponseSchema,
  type CreateGameRequest,
  type Game,
  type TargetGameLength,
  type TurnResolution
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

const defaultTestUserId = "local-dev-user";

type SeededPlaythroughFixture = {
  name: string;
  seed: string;
  scenarioId: string;
  factionId: string;
  targetGameLength: TargetGameLength;
  optionIds: string[];
  expectedOutcomeCategory:
    | "strategic_success"
    | "partial_success"
    | "stalemate"
    | "crisis_deescalation"
    | "catastrophic_escalation";
  expectedWinningFactionId?: string | null;
  expectedPublicFlags?: string[];
  expectedRevealedEvents?: string[];
  maxCompletedRounds: number;
};

function createServices() {
  return createApiServices(testConfig);
}

function assertSoloRoundHistoryIntegrity(turns: TurnResolution[], completedRoundCount: number) {
  const groupedRounds = new Map<number, TurnResolution[]>();

  for (const turn of turns) {
    const existing = groupedRounds.get(turn.progression.roundNumber) ?? [];
    existing.push(turn);
    groupedRounds.set(turn.progression.roundNumber, existing);
  }

  const sortedRoundNumbers = [...groupedRounds.keys()].sort((left, right) => left - right);

  for (const roundNumber of sortedRoundNumbers) {
    const roundTurns = (groupedRounds.get(roundNumber) ?? []).sort(
      (left, right) => left.progression.roundActionIndex - right.progression.roundActionIndex
    );

    assert.equal(roundTurns[0]?.progression.roundActionIndex, 1);

    for (const [index, turn] of roundTurns.entries()) {
      assert.equal(
        turn.progression.roundActionIndex,
        index + 1,
        `Round ${roundNumber} should keep contiguous action indices for replay continuity.`
      );
      assert.ok(turn.progression.roundActionCount >= turn.progression.roundActionIndex);
    }

    const expectedRoundActionCount = roundTurns[0]?.progression.roundActionCount ?? 0;
    assert.ok(expectedRoundActionCount >= roundTurns.length);

    if (roundTurns.length === expectedRoundActionCount) {
      const finalTurn = roundTurns.at(-1);
      assert.equal(
        finalTurn?.progression.advancesRound,
        true,
        `Completed solo round ${roundNumber} should advance the round on its final action.`
      );
    }
  }

  const fullyCompletedRounds = [...groupedRounds.values()].filter((roundTurns) => {
    const expectedRoundActionCount = roundTurns[0]?.progression.roundActionCount ?? 0;
    return roundTurns.length === expectedRoundActionCount;
  }).length;

  assert.equal(
    fullyCompletedRounds,
    completedRoundCount,
    "Completed round count should match the number of fully recorded solo rounds."
  );
}

async function createSeededSoloGame(input: {
  scenarioId: string;
  factionId: string;
  seed: string;
  targetGameLength: TargetGameLength;
}) {
  const services = createServices();
  const createPayload: CreateGameRequest = {
    scenarioId: input.scenarioId,
    mode: "solo",
    targetGameLength: input.targetGameLength,
    debug: {
      deterministicMode: true,
      seed: input.seed
    },
    players: [
      {
        name: "Regression Player",
        role: "human",
        factionId: input.factionId
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

async function runSeededPlaythroughFixture(fixture: SeededPlaythroughFixture) {
  const { services, game: createdGame } = await createSeededSoloGame({
    scenarioId: fixture.scenarioId,
    factionId: fixture.factionId,
    seed: fixture.seed,
    targetGameLength: fixture.targetGameLength
  });
  const actingPlayer = createdGame.players.find((player) => player.role === "human");

  assert.ok(actingPlayer, "Expected a human acting player for seeded regression.");

  let currentGame: Game = createdGame;

  for (const optionId of fixture.optionIds) {
    const submission = turnResolutionResponseSchema.parse(
      await services.turnSubmissionService.submitTurn(currentGame.id, defaultTestUserId, {
        playerId: actingPlayer.id,
        factionId: actingPlayer.factionId ?? fixture.factionId,
        optionId,
        declaredIntent: `Regression fixture: ${fixture.name}`,
        parameters: {},
        clientContext: {
          source: "phase7-regression"
        }
      })
    );

    currentGame = submission.game;

    if (currentGame.state.derived.outcome.status === "ended") {
      break;
    }
  }

  const turnHistory = turnsListResponseSchema.parse({
    turns: await services.turnSubmissionService.listTurns(currentGame.id)
  });

  assert.equal(currentGame.status, "completed", `${fixture.name} should resolve to a completed session.`);
  assert.equal(
    currentGame.state.derived.outcome.status,
    "ended",
    `${fixture.name} should reach an ended outcome.`
  );
  assert.equal(
    currentGame.state.derived.outcome.category,
    fixture.expectedOutcomeCategory,
    `${fixture.name} should stay pinned to the expected outcome category.`
  );
  assert.equal(
    currentGame.state.derived.outcome.winningFactionId,
    fixture.expectedWinningFactionId ?? null,
    `${fixture.name} should keep the expected winner.`
  );
  assert.ok(
    currentGame.progression.completedRoundCount <= fixture.maxCompletedRounds,
    `${fixture.name} exceeded its expected round ceiling.`
  );

  for (const flag of fixture.expectedPublicFlags ?? []) {
    assert.equal(
      currentGame.state.public.publicFlags.includes(flag),
      true,
      `${fixture.name} should include public flag ${flag}.`
    );
  }

  for (const eventId of fixture.expectedRevealedEvents ?? []) {
    assert.equal(
      currentGame.state.public.revealedEvents.includes(eventId),
      true,
      `${fixture.name} should include revealed event ${eventId}.`
    );
  }

  assert.ok(turnHistory.turns.length >= currentGame.progression.completedRoundCount);
  assertSoloRoundHistoryIntegrity(turnHistory.turns, currentGame.progression.completedRoundCount);
}

const playthroughFixtures: SeededPlaythroughFixture[] = [
  {
    name: "short Berlin solo run reaches a de-escalatory ending quickly",
    seed: "phase7-berlin-short-offramp",
    scenarioId: "scenario-cold-war-berlin-mvp",
    factionId: "faction-usa",
    targetGameLength: "short",
    optionIds: ["option-usa-backchannel", "option-usa-alliance-summit", "option-usa-backchannel"],
    expectedOutcomeCategory: "crisis_deescalation",
    expectedWinningFactionId: null,
    expectedPublicFlags: ["quiet-channel-active"],
    expectedRevealedEvents: ["private-overtures-reported"],
    maxCompletedRounds: 3
  },
  {
    name: "short Suez solo run preserves the Egypt off-ramp line without consuming the whole short-game budget",
    seed: "phase7-suez-short-offramp",
    scenarioId: "scenario-suez-crisis-mvp",
    factionId: "faction-egypt",
    targetGameLength: "short",
    optionIds: [
      "option-egypt-un-appeal",
      "option-egypt-canal-disruption",
      "option-egypt-superpower-mediation"
    ],
    expectedOutcomeCategory: "strategic_success",
    expectedWinningFactionId: "faction-egypt",
    expectedPublicFlags: ["ceasefire-channel-visible", "ceasefire-pressure-converged"],
    expectedRevealedEvents: ["suez-ceasefire-pressure-converges"],
    maxCompletedRounds: 3
  },
  {
    name: "medium Suez solo run preserves the Egypt off-ramp regression path",
    seed: "phase7-suez-medium-offramp",
    scenarioId: "scenario-suez-crisis-mvp",
    factionId: "faction-egypt",
    targetGameLength: "medium",
    optionIds: [
      "option-egypt-un-appeal",
      "option-egypt-radio-campaign",
      "option-egypt-superpower-mediation"
    ],
    expectedOutcomeCategory: "strategic_success",
    expectedWinningFactionId: "faction-egypt",
    expectedPublicFlags: ["ceasefire-channel-visible", "ceasefire-pressure-converged"],
    expectedRevealedEvents: ["suez-ceasefire-pressure-converges"],
    maxCompletedRounds: 3
  }
];

for (const fixture of playthroughFixtures) {
  test(`seeded playthrough regression: ${fixture.name}`, async () => {
    await runSeededPlaythroughFixture(fixture);
  });
}
