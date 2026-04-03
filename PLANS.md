# Wargame App Execution Plans

## Current priority
Make solo mode genuinely strong and fully playable before building multiplayer features.

## Working rules
- Backend remains the canonical source of truth.
- LLM outputs are untrusted until validated.
- Favor incremental changes and preserve existing working behavior.
- Keep scenario additions data-driven where possible.
- Dynamic options are a required end-state for solo gameplay.
- OpenAI-backed advisor/turn quality matters, but mock-first systems remain the default path for architecture and solo-loop iteration.

## Active plan: Solo Game Completion

### Goal
Deliver a solo mode that is coherent, replayable, strategically interesting, and understandable turn to turn.

### Success criteria
- options vary dynamically by state and scenario context
- objectives and end states feel meaningful
- pacing feels intentional across short/medium/long games
- bot behavior feels plausible
- advisor is context-aware and useful
- turn summaries clearly explain what changed and why
- at least one full solo playthrough feels genuinely playable
- evals/regression checks protect core quality

### Baseline captured before implementation
- relevant backend tests and repository-wide typecheck are currently passing
- the Berlin scenario is the primary solo validation scenario
- solo mode currently advances `turnNumber` per faction action, which distorts pacing and end-state maturity
- available options are selected from a static `choiceCatalog` and scored, rather than generated from a backend legal-move system
- turn resolution currently writes placeholder next-faction briefings/intelligence after actions
- the mock bot mirrors current recommendation ranking instead of expressing distinct opponent behavior
- current evals cover schema, visibility, and provider checks, but do not yet protect seeded full solo playthrough quality

### Recommended defaults
- treat a solo "turn" as a round-level player plus AI exchange
- keep the architecture mock-first and provider-agnostic until the solo loop is solid
- preserve backend authority, visibility boundaries, and strict schema validation throughout

### Phase 0: Plan update and baseline capture
Status: completed

Deliverables
- replace the prior high-level solo checklist with this execution plan
- record the current baseline, weak spots, and recommended defaults here before further implementation

Depends on
- none

Unlocks
- all implementation work

### Phase 1: Solo turn model and progression foundation
Status: completed

Goal
- make one player action plus one AI response map cleanly to one player-facing solo turn without weakening backend authority

Concrete steps
1. Add explicit progression metadata to shared contracts for `Game` and `TurnResolution`.
2. Keep solo player and AI resolutions under the same canonical round number, and only advance the session `turnNumber` after the AI follow-up resolves.
3. Align outcome maturity and pacing calculations to the solo round model instead of per-faction action advancement.
4. Preserve head-to-head behavior unless a shared abstraction reduces rework safely.
5. Update turn history and replay-oriented records so solo round sequencing remains reconstructible.
6. Add focused tests for solo human-plus-AI progression and keep current typecheck green.

Depends on
- Phase 0

Unlocks
- dynamic legal options
- believable bot behavior
- meaningful pacing and playtests

### Phase 2: State-driven option generation
Status: completed

Goal
- replace mostly static catalog selection with backend-computed legal options driven by canonical state

Concrete steps
1. Introduce a dedicated backend rules layer for legal option generation. Completed with a legal-option service that filters scenario options before presentation scoring.
2. Add scenario-side metadata for prerequisites, cooldowns, one-time choices, follow-ups, and state-tagged variants. Completed for the initial Berlin slice through option metadata rules and faction-private option-usage tracking.
3. Separate reusable option templates from "legal right now" options. Completed for the initial slice by adding backend-generated variants from option templates before legality filtering and ranking.
4. Keep visibility strict: the backend computes legality, the frontend renders approved options only. Completed for the current slice.
5. Add tests for prerequisites, cooldowns, variants, and trigger-based availability. Completed for the current rule-engine and generated-variant slice; expand as new rule types are added.

Depends on
- Phase 1

Unlocks
- stronger opponent behavior
- replayability
- better advisor context

### Phase 3: Opponent strategy and private-state quality
Status: completed

Goal
- make the AI feel like an opponent rather than a mirror of current recommendation scoring

Concrete steps
1. Replace simple top-ranked-option bot behavior with strategy logic that considers objectives, risk appetite, hidden state, and tempo. Completed for the current solo foundation with deterministic backend heuristic scoring driving bot choice instead of raw recommendation rank.
   Current slice now includes faction-doctrine context so different sides can prefer different categories under the same public pressure.
   Scenario-authored faction strategy profiles now shape that doctrine layer directly, so Berlin and Suez can push distinct bot and advisor behavior without adding new service-level branching.
2. Improve backend-owned private briefings and intelligence updates so solo information feels coherent after each exchange. Completed for the current solo foundation with deterministic faction-aware briefing and intelligence updates replacing placeholder text.
   Current slice now reuses the same backend doctrine snapshot in bot rationale, private briefing, intelligence summaries, and advisor-visible strategic context so the opponent and solo information model feel like one system.
   Scenario-authored private-state evolution now updates hidden tracks and secret flags before next-option generation, so solo private pressure changes are no longer mostly static after setup.
3. Keep provider-backed bot output advisory and constrained to backend-legal actions. Completed for the current slice: provider input now acts as a weak advisory overlay, and backend heuristics remain authoritative.
4. Add tests proving the AI can choose different actions under different canonical states. Completed for the current slice, including doctrine-sensitive bot expectations, scenario-profile overrides, advisor-context coverage, and private-state evolution checks.

Depends on
- Phase 2

Unlocks
- believable solo opposition
- better private-state quality
- stronger advisor recommendations

### Phase 4: Scenario pacing, events, and outcome logic
Status: completed

Goal
- make solo scenarios produce stronger mid-game motion and more meaningful end states

Concrete steps
1. Add light scenario event and pacing hooks tied to canonical triggers. Completed with a backend-owned event layer now integrated into turn resolution, including metadata-authored event rules for Berlin and Suez that can reveal events, adjust public pressure, and add warnings before outcome evaluation and next-option generation.
   Berlin now has an initial branching event chain so the airlift path can surface a fragile off-ramp while the checkpoint path can harden into a sharper military faceoff.
   Suez now has matching branching event pressure so mediation can open a ceasefire channel while coalition mobilization can harden into a narrow intervention window.
   Suez now also has a follow-on ceasefire convergence branch so successful mediation can mature into a stronger off-ramp rather than stalling at a single event reveal.
2. Refactor outcome logic away from brittle hard-coded assumptions where necessary. Completed with a metadata-driven outcome model now handling faction progress scoring, de-escalation pressure, catastrophic pressure, and leader-based resolution without relying on a fixed USA versus USSR pairing.
   Outcome evaluation now also reads canonical public flags and revealed events, so scenario-authored event chains can directly shift de-escalation pressure, catastrophic pressure, and faction progress instead of influencing endings only through raw track deltas.
3. Calibrate short, medium, and long game targets around the solo round model. Completed with scenario-authored guidance rounds and threshold tuning for Berlin and Suez so round-based pacing produces earlier de-escalation windows, clearer strategic wins, and late balanced stalemates.
4. Add tests for de-escalation, strategic success, stalemate, and catastrophic escalation under round-based pacing. Completed with direct outcome-service coverage, solo integration assertions that Berlin events surface in canonical state after the first exchange, and seeded multi-round solo flow tests for Berlin and Suez that exercise both escalation and de-escalation branches through to concrete endings.
   Current seeded integration coverage now includes a Berlin escalation line, a Berlin de-escalation line, a Suez coalition catastrophic line, and a Suez Egypt strategic off-ramp line driven by ceasefire convergence.

Depends on
- Phases 1-3

Unlocks
- meaningful full playthroughs
- balancing work

### Phase 5: Advisor usefulness pass
Status: completed

Goal
- make advisor guidance reflect the real solo situation rather than a thinner early-state approximation

Concrete steps
1. Rebuild advisor context around stronger legal-option and private-state pipelines. Completed with a backend-authored advisor-framing layer that summarizes round pacing, visible pressure, opponent posture, and option-by-option tradeoffs from canonical visible state before provider generation.
2. Improve recommendation rationale, risk framing, and option comparisons around current round pacing. Completed with the mock and OpenAI advisor paths now consuming the same backend framing so recommendations stay aligned with solo round pacing, outcome pressure, and visible option tradeoffs.
   The current slice also makes next-move answers compare a leading option against a visible alternative instead of only naming one top move.
3. Keep outputs schema-validated and visibility-safe. Completed with provider-backed sanitization still enforcing visible option ids only, now capped to a concise recommendation list server-side.
4. Add tests for usefulness and visibility against richer solo contexts. Completed with advisor framing unit tests, comparative mock-advisor tests, updated OpenAI prompt tests, provider-backed advisor service coverage, and refreshed deterministic eval fixtures.

Depends on
- Phases 2-4

Unlocks
- reliable player guidance

### Phase 6: Solo UX clarity and session readability
Status: pending

Goal
- present solo rounds, AI follow-up, and outcome pressure clearly to players

Concrete steps
1. Update the web UI to show round-level progression and AI follow-up more clearly.
2. Make history and current-state panels distinguish player and AI changes within a solo round.
3. Surface objectives, pacing, and outcome pressure without exposing hidden state.
4. Validate the experience with small manual playtests before wider balancing.

Depends on
- Phases 1-5

Unlocks
- stronger non-developer playtestability

### Phase 7: Replayability, evals, and balancing
Status: pending

Goal
- protect solo quality with deterministic checks and structured balancing

Concrete steps
1. Add seeded full-playthrough regression fixtures for short and medium solo runs.
2. Extend backend tests around round progression, option legality, AI validity, outcome transitions, and visibility-safe advisor context.
3. Run structured solo playtests and rebalance Berlin thresholds, event triggers, and option weights.
4. Use deterministic replay/debug tooling to compare behavior across refactors.

Depends on
- Phases 1-6

Unlocks
- confidence to call solo mode fully playable

## How to work from this plan
- inspect the codebase before each phase or bounded subtask
- update the relevant phase status before implementation
- implement one reviewable step at a time
- keep this file current as phases complete or change
