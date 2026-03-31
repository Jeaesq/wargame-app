# Architecture

## System goals

- Backend is the canonical source of truth for all game state
- Shared contracts define strict boundaries between backend, frontend, and LLM layers
- LLM output is always treated as untrusted input until validated
- Saved games must be resumable without replaying prompt history

## Repository layout

- `apps/web`: Next.js frontend application
- `apps/api`: Node.js TypeScript backend
- `packages/shared`: shared TypeScript types and validation schemas
- `docs`: product, architecture, prompt, and scenario documentation

## High-level runtime model

The web app renders current state and submits player decisions to the API. The API computes legal moves, resolves selected actions, updates canonical state, and requests structured narrative assistance from the LLM. The LLM returns only schema-constrained artifacts such as world updates, hidden intelligence text, and choice copy proposals. The backend validates those artifacts, stores approved results, and sends the final turn payload to the client.

## Core entities

### ScenarioDefinition

Defines static scenario content and rules.

- `scenarioId`
- `title`
- `playableFactions`
- `startingState`
- `turnStructure`
- `ruleParameters`
- `promptContext`

### GameSession

The persisted canonical playthrough.

- `sessionId`
- `scenarioId`
- `ownerUserId`
- `mode`
- `playerAssignments`
- `turnNumber`
- `phase`
- `rngState`
- `state`
- `history`
- `status`

### TurnRecord

One resolved turn or sub-turn.

- `turnId`
- `turnNumber`
- `actingFactionIds`
- `presentedOptions`
- `selectedOptions`
- `resolutionSummary`
- `publicUpdates`
- `privateUpdates`

### FactionState

State owned by one faction, split by visibility.

- public values visible to all players
- private values visible only to that faction or backend
- derived values computed during read/model preparation

### OptionDefinition

Backend-approved action shape presented to players.

- `optionId`
- `kind`
- `label`
- `description`
- `constraints`
- `advisory`
- `effectPayload`

## State model

State should be represented in three layers.

### Public state

Safe to reveal to all players and to include in most prompts.

- current turn and phase
- openly known geopolitical posture
- public resources and track positions
- already revealed world events
- publicly shown option menu text

### Private state

Visible only to a specific faction and backend systems.

- intelligence assessments
- hidden capabilities or readiness
- secret commitments and covert operations
- internal pressure, trust, or doctrine values
- unrevealed consequences queued for disclosure later

### Derived state

Computed by the backend and not treated as persisted source truth unless explicitly snapshot for performance reasons.

- legal moves for the current actor
- recommendation percentages
- tension indexes calculated from canonical fields
- victory outlook summaries
- prompt-ready view models

## Turn-resolution flow

### 1. Load session

Backend loads scenario definition and canonical session state.

### 2. Compute active turn context

Backend determines:

- whose turn it is
- what phase is active
- what legal actions are available
- what hidden/private context should be exposed to each actor

### 3. Build structured LLM input

Backend prepares a prompt context that includes:

- scenario framing
- public state summary
- actor-specific private context when needed
- legal action constraints
- required JSON schema

### 4. Ask LLM for narrative artifacts

The LLM may generate:

- public world update draft
- private intelligence briefs
- flavor text and concise action menu wording
- structured tags about narrative developments

It does not finalize rules outcomes or invent illegal actions.

### 5. Validate and normalize output

Backend validates every LLM payload against shared schemas, rejects malformed output, and may retry with clarified instructions or fall back to deterministic text.

### 6. Present options to player

Frontend receives only backend-approved options and allowed visibility slices.

### 7. Accept player choice

Backend validates:

- player identity and faction authority
- option id validity
- phase correctness
- session status

### 8. Resolve action deterministically

Backend applies rules, probabilities, and state transitions. Any randomness must come from a backend-owned seeded source.

### 9. Generate post-resolution narrative

Backend may ask the LLM to narrate the already-computed result, again using strict schemas.

### 10. Persist and respond

Backend stores the updated session and turn record, then returns the appropriate public/private view models.

## Responsibilities split

### Backend responsibilities

- own canonical session state
- define schemas and validation
- compute legal actions
- enforce turn order and permissions
- resolve rules and randomness
- manage persistence and save/load
- decide what information is public or private
- sanitize and store approved LLM outputs

### LLM responsibilities

- generate concise world narration
- propose flavorful but constrained option text
- produce hidden developments in structured form
- summarize consequences after backend resolution
- add uncertainty and thematic texture without changing state authority

## Provider seam

The backend should treat narrative and strategy generation as a replaceable provider concern, not as core game-state logic.

- `prompt/input preparation`: application services prepare provider inputs from canonical public, private, and derived state
- `provider invocation`: a provider implementation is called with structured inputs
- `output validation`: provider outputs are validated against shared Zod schemas before use
- `canonical application`: backend services apply validated artifacts into canonical game state

## Identity and ownership

- canonical sessions store an `ownerUserId`
- player slots may store a `userId`
- current prototype identity is resolved from a development header or backend default, not from production auth
- session list and retrieval routes are now ownership-aware
- the intent is to replace the request identity resolver later without redesigning the game/session services
- shared access helpers now centralize current session access and player-control semantics so future auth and seat-claim flows do not have to rediscover that logic piecemeal

Current default:

- mock provider implementations for turn generation, bot decision support, and advisor answers

Future extension:

- an OpenAI-backed provider can be selected through configuration without changing routes, repositories, or frontend contracts
- provider outputs should stay narrow and non-authoritative, for example narrative text, tags, and ranked suggestions rather than direct state mutations

Initial OpenAI seam:

- provider mode is selected through backend configuration
- OpenAI integration is split into prompt construction, API invocation, schema validation, and mapping layers
- OpenAI remains optional and non-default during development
- the current OpenAI module is a skeleton for future Responses API work, not a production-complete integration

### Frontend responsibilities

- render current public/private views
- collect player choices
- show advisory percentages as non-authoritative guidance
- avoid deriving hidden or rule-sensitive state on its own

## Contracts and validation

- Shared schemas should live in `packages/shared`
- Every prompt response shape should have a Zod schema
- The API should validate both inbound client payloads and inbound LLM payloads
- Persisted records should favor explicit versioned objects over ad hoc blobs

## Persistence guidance

The model should be PostgreSQL-ready even if initial storage is file-based or in-memory.

Recommended persistence concepts:

- `scenarios`
- `game_sessions`
- `turn_records`
- `player_assignments`
- `faction_private_state` if private slices are separated physically later

For the phased plan to evolve this into true multi-controller multiplayer, see [multiplayer-next-steps](./multiplayer-next-steps.md).

## Extensibility direction

The architecture should support future additions without redesigning the core loop.

- more scenarios sharing the same session engine
- more factions and partial-information modes
- asynchronous multiplayer
- AI-controlled factions through the same legal-move interface
- analytics, replay, and moderation tooling

## Maintenance notes

- Keep the backend API tests lightweight and focused on the canonical MVP loop
- Prefer end-to-end route coverage for session creation, turn submission, bot follow-up persistence, and advisor contract validation
- Keep provider and persistence seams covered through the default mock + in-memory runtime path unless a specific database/provider path needs separate regression coverage
