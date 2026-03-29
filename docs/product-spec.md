# Product Specification

## Product vision

Build a browser-based turn-based geopolitical crisis simulation where players lead Cold War factions through escalating historical-style events. The experience should feel like a serious strategy game rather than a story generator: the world responds plausibly, uncertainty matters, and choices create lasting strategic consequences across multiple turns.

The product should combine:

- deterministic backend-owned rules and state
- LLM-assisted narrative updates and choice framing
- hidden/private information per faction
- replayable crisis scenarios with branching outcomes

## Player experience goals

- Present a tense, comprehensible crisis each turn
- Offer a small set of meaningful strategic choices
- Reflect imperfect information and fog of war
- Show plausible consequences instead of obviously scripted outcomes
- Support both solo play and head-to-head play without changing the core model

## MVP scope

The MVP is intentionally narrow.

- One historical-inspired Cold War scenario
- One-player mode and two-player mode
- Browser client with turn-based interaction
- Backend API that owns the authoritative game state
- LLM-generated turn summaries, hidden developments, and proposed choice menus
- Save/load support for ongoing sessions

## Explicit non-goals for MVP

- No real-time play
- No open-ended freeform player input as the primary interaction
- No tactical combat map
- No full campaign spanning many decades
- No multiplayer matchmaking or live sync infrastructure
- No AI opponent that directly mutates state outside backend rules

## Core entities

### Scenario definition

Static content that defines:

- factions
- starting state
- turn structure
- event tables or scripted beats
- scenario-specific rules and victory pressures

### Game session

A persisted playthrough instance tied to:

- scenario id
- player count and faction assignment
- current turn number
- canonical state snapshot
- random seed or deterministic random stream state
- action history

### Faction

Represents a playable or simulated geopolitical actor. For MVP this will likely include:

- faction id
- display name
- doctrine and strategic incentives
- public attributes
- hidden/private attributes

### Turn

The atomic gameplay loop. A turn stores:

- phase
- acting faction or factions
- presented choices
- player selections
- resolution outcome
- generated narrative artifacts

### Choice option

A backend-approved action the player may take on a turn.

- unique option id
- label and description
- availability requirements
- advisory risk/confidence percentages
- structured effects or effect references for backend resolution

### Event or development

A notable world update created during resolution.

- public-facing update
- private update for one faction
- machine-readable tags for downstream rule checks

## Gameplay principles

- Choices should be few enough to evaluate but broad enough to feel strategic
- Recommendation percentages are advisory estimates, not guarantees
- Public narrative should be readable in seconds
- Private intelligence should create asymmetry without becoming opaque noise
- The system should prefer plausible geopolitical consequences over spectacle

## Success criteria for MVP

- A player can start a scenario and complete several turns without ambiguity
- Turn outputs are stable and schema-valid even when LLM output varies
- Hidden information is delivered only to the correct faction
- Saves can be resumed without relying on the LLM to reconstruct state
- The content model is reusable for future scenarios

## Future extensibility

The MVP design should leave room for:

- additional scenarios with different turn cadences
- more than two factions
- AI-controlled factions using the same legal-action pipeline
- event decks, intelligence systems, and diplomacy layers
- database-backed persistence and analytics
- richer moderator and replay tooling
