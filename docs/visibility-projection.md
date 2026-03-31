# Visibility Projection

The backend stores one canonical `Game` record and derives player-facing views from it.

## Projection modes

### `system`

- full canonical state
- used only by backend workflows such as persistence, turn resolution, and future internal tooling

### `public`

- includes public state and safe shared metadata
- strips `state.privateByPlayer`
- strips action-specific derived ids such as `actingPlayerIds`, `legalActionIds`, and `recommendedActionIds`
- strips faction-scoped advisor answers
- strips private turn-resolution details from `lastResolution`

### `faction`

- includes the shared public state
- includes only the requested faction or player private slices
- keeps derived action ids only when they are visible through that faction-private view
- keeps only faction-visible advisor answers
- keeps only matching private turn-resolution details

## Current defaults

- session list responses use the `public` projection
- single-human session retrieval defaults to the relevant faction-private view
- multi-human ambiguous retrieval defaults to the `public` projection unless a `playerId` or `factionId` is supplied
- advisor context is always built from the `faction` projection
- turn resolution still runs on canonical state, but provider inputs now also receive projected `publicView` and `actingFactionView`

## Why this exists

This keeps the backend as the source of truth while making visibility rules explicit and reusable. It also prepares the app for:

- multiple human-controlled factions
- stricter advisor visibility guarantees
- future providers that need both canonical and player-visible state without conflating them

The planned multi-device multiplayer flow continues to build on these same projections. See [multiplayer-next-steps](./multiplayer-next-steps.md).
