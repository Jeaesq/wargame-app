# Identity Groundwork

The prototype now has a lightweight backend identity seam for session ownership.

## Current model

- every canonical game session has an `ownerUserId`
- every player slot may have a `userId`
- in the current prototype, human player slots created with a new session default to the creating user's id
- AI players keep `userId: null`

This is enough to support:

- ownership-aware session lists
- basic access checks for session retrieval
- validation that turn submissions and advisor calls come from the correct user/player pairing

## How identity works today

The API resolves a request user id in this order:

1. `x-wargame-user-id` request header
2. `DEV_DEFAULT_USER_ID` from backend config

Optional display name support is available through:

- `x-wargame-user-name`

Default local development behavior:

- if no identity header is sent, the backend treats the request as `local-dev-user`
- this preserves the current single-user development flow with no login step

The web app can also send a fixed dev identity header by setting:

- `WARGAME_DEV_USER_ID`
- `WARGAME_DEV_USER_NAME`

## Current access behavior

- `GET /games` returns only sessions owned by or assigned to the resolved user
- `GET /games/:gameId` requires the resolved user to be the owner or an assigned player
- `POST /games` stamps the new session with `ownerUserId`
- `POST /games/:gameId/turns` requires the resolved user to match the submitted `playerId`
- advisor requests require the resolved user to be a session participant, and if `playerId` is supplied it must belong to that user

## Why this is intentionally simple

Full production auth is still premature for the prototype. The current approach gives us:

- no-login local usability
- a stable backend-owned identity field in persisted session data
- a clean seam for replacing header/default identity resolution with real auth later

## Planned evolution

Later, real auth can replace the request identity resolver without changing core game services much. Expected next steps:

- persist first-class users and memberships
- allow invited users to claim open faction slots
- separate owner, participant, observer, and admin roles
- move from development headers/defaults to signed sessions or tokens

For the concrete multi-device multiplayer flow and phased implementation plan, see [multiplayer-next-steps](./multiplayer-next-steps.md).
