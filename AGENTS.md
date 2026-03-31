# Wargame App Project Instructions

You are working on a turn-based geopolitical wargame web application.

## Product goal
Build a browser-based strategy game in which 1 or more players take turns making choices in a dynamic historical crisis scenario. The system uses an LLM to help evolve the scenario turn by turn, but the backend remains the canonical source of truth for game state.

## Architecture priorities
1. Deterministic backend-owned game state
2. LLM-assisted turn narration and option generation
3. Clear separation between public state, private state, and derived state
4. Strict schema validation for all LLM outputs
5. Save/load support for multi-session gameplay
6. Easy future expansion to more scenarios and multiplayer

## Technical preferences
- TypeScript everywhere
- Frontend: Next.js
- Backend: Node.js / TypeScript
- Shared schemas in packages/shared
- PostgreSQL-ready data model
- Clean, readable code over clever code
- Small, reviewable commits
- Avoid unnecessary dependencies

## Execution plans

For complex features, major refactors, or multi-step initiatives, use `PLANS.md` as the execution-plan source of truth.

When working from a plan:
- read `PLANS.md` first
- propose or update the relevant phase/subtasks before coding
- keep the plan current as work progresses
- implement in small, reviewable increments
- preserve the currently working app unless the plan explicitly calls for a broader change

Current product priority:
- make solo mode genuinely strong and fully playable before prioritizing multiplayer
- multiplayer groundwork may continue where it reduces future rework, but multiplayer features are not the current focus

## Game design priorities
- Cold War historical scenario for MVP
- 1-player and 2-player modes first
- Fog of war
- Hidden/private information per faction
- Recommendation percentages shown as advisory estimates, not absolute truth
- Realism, plausibility, and replayability are more important than flashy UI

## LLM integration rules
- Do not make the LLM the source of truth for game state
- LLM outputs must be structured JSON validated against schemas
- Backend computes legal moves, turn order, random seeds, persistence, and validation
- LLM generates narrative updates, hidden developments, and next-choice proposals

## Working style
- Before major changes, inspect the relevant files
- Preserve existing conventions
- Prefer incremental implementation
- Leave TODOs only when clearly labeled and intentional
- When creating new files, make sure imports and paths are consistent