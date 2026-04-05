import test from "node:test";
import assert from "node:assert/strict";
import {
  createSoloGame,
  defaultTestUserId
} from "./test-support/app-test-helpers.js";

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
