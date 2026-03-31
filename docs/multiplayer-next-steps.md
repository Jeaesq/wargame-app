# Multi-Controller Multiplayer Next Steps

This document describes the practical path from the current development-identity prototype to true multi-controller multiplayer across separate devices.

## Target user flow

### 1. Log in

A future user opens the web app on their own device and authenticates with a real identity provider.

Expected shape:

- the browser receives a signed session cookie or bearer token
- the API resolves that token into a stable backend user id
- the existing request identity seam becomes the auth adapter boundary

Current prototype equivalent:

- `x-wargame-user-id` header or backend default identity

### 2. Open or join a session

There are two supported entry paths:

- open a session the user already owns or controls
- join a session through a direct invite or join link

Recommended backend behavior:

- session list returns only sessions the authenticated user can see
- a join link identifies the target session and optionally a seat token
- the backend decides whether the user may see only public data or a faction-private view

### 3. Claim or be assigned a faction

Faction control should remain backend-owned.

Recommended states for a human-playable seat:

- open: no user has claimed the seat yet
- reserved: the owner invited a specific user but they have not accepted yet
- claimed: a user controls the seat
- locked: scenario setup or moderation prevents reassignment

Recommended flows:

- owner assigns a faction directly to a known user
- invited user accepts a reservation
- invited user claims an open seat from a join screen

### 4. See only that faction's private information

The API should continue projecting one canonical session into distinct views:

- public session view for lobby-like access
- faction-private session view for the controller of that faction
- system/internal view for backend resolution only

The frontend should never infer private information from canonical state. It should always request an explicit player or faction view, and the backend should reject mismatched identity and view selections.

### 5. Submit only that faction's legal actions

Turn submission should continue to require:

- authenticated user identity
- selected player id
- backend validation that the player belongs to that user
- backend validation that the action is legal in that faction-private state

This keeps the backend as the source of truth even when multiple human players act from different devices.

## Recommended implementation phases

### Phase 1: auth replacement

Replace the development identity resolver with a real auth adapter while keeping the rest of the services stable.

Deliverables:

- first-class `User` persistence
- auth session or token verification
- request identity resolved from auth instead of development headers

### Phase 2: explicit seat lifecycle

Add explicit player-seat assignment state rather than inferring everything from `player.userId`.

Deliverables:

- reserved/open/claimed seat status
- optional invite token or reservation reference
- session lobby read model

### Phase 3: join and claim APIs

Add minimal multiplayer APIs without changing turn resolution.

Recommended endpoints:

- `GET /games/:gameId/access`
- `POST /games/:gameId/join`
- `POST /games/:gameId/players/:playerId/claim`
- `POST /games/:gameId/players/:playerId/release`

These should update seat ownership only. They should not change canonical game rules or visibility logic.

### Phase 4: session lobby UI

Add a simple pre-game and in-session lobby view that shows:

- owner
- claimed seats
- open seats
- reserved seats
- which faction the current user controls

The lobby can stay lightweight. It does not need real-time sync at first.

### Phase 5: multiplayer turn coordination

Once multiple human users are active in the same session, tighten turn coordination around:

- whose action is awaited
- whether simultaneous phases ever exist
- how stale session views are refreshed after another user acts

This can still use ordinary request/response polling before adding websockets.

## Remaining architectural gaps

The current architecture is close, but these gaps remain before true multiplayer:

- no first-class `User` entity or auth session model
- no explicit seat state beyond `player.userId`
- no invitation, reservation, or seat-claim persistence
- no lobby read model for open and reserved factions
- no route dedicated to seat assignment lifecycle
- no distinction yet between "can view public session" and "can control faction seat" for invited non-controllers
- no audit trail for seat reassignment or invite acceptance

## Minimal scaffolding added now

The codebase now includes shared access-policy helpers that centralize current semantics:

- whether a user can access a session
- which players a user controls
- whether a human seat is currently open for future claim flow work

This is intentionally small. It reduces future rework by giving auth, lobby, and seat-claim features one shared vocabulary without changing today’s routes or frontend contracts.
