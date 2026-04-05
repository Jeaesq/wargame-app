import {
  getPlayerAssignmentStatus,
  getUserSessionAccessRole,
  listPlayersControlledByUser,
  type Game,
  type Player
} from "@wargame/shared";

const defaultUserId = process.env.WARGAME_DEV_USER_ID ?? "local-dev-user";
const defaultUserName = process.env.WARGAME_DEV_USER_NAME ?? "Local Dev User";

export function getCurrentUserIdentity() {
  return {
    userId: defaultUserId,
    displayName: defaultUserName
  };
}

export function getControlledPlayers(game: Game): Player[] {
  const currentUserId = getCurrentUserIdentity().userId;

  return listPlayersControlledByUser(game, currentUserId);
}

export function getSelectedPlayerView(game: Game, playerId?: string | null): Player | null {
  const controlledPlayers = getControlledPlayers(game);

  if (playerId) {
    return controlledPlayers.find((player) => player.id === playerId) ?? null;
  }

  return controlledPlayers[0] ?? null;
}

export function getProjectedPlayerView(game: Game, playerId?: string | null): Player | null {
  return (
    getSelectedPlayerView(game, playerId) ??
    (game.state.privateByPlayer[0]?.playerId
      ? game.players.find((player) => player.id === game.state.privateByPlayer[0]?.playerId) ?? null
      : null) ??
    game.players.find(
      (player) => player.role === "human" && player.factionId === game.currentFactionId
    ) ??
    game.players.find((player) => player.role === "human") ??
    null
  );
}

export function getFactionName(game: Game, factionId?: string | null): string {
  if (!factionId) {
    return "Public session";
  }

  return game.factions.find((faction) => faction.id === factionId)?.name ?? factionId;
}

export function getCurrentUserAccessRole(game: Game) {
  return getUserSessionAccessRole(game, getCurrentUserIdentity().userId);
}

export function getClaimableFactionSeats(game: Game): Player[] {
  return game.players.filter((player) => getPlayerAssignmentStatus(player) === "open_human");
}

export function buildFactionViewHref(input: {
  pathname: string;
  playerId?: string | null;
  factionId?: string | null;
}) {
  const query = new URLSearchParams();

  if (input.playerId) {
    query.set("playerId", input.playerId);
  }

  if (input.factionId) {
    query.set("factionId", input.factionId);
  }

  return query.size > 0 ? `${input.pathname}?${query.toString()}` : input.pathname;
}
