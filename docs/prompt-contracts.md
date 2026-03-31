# Prompt Contracts

## Purpose

This document defines how the backend should interact with the LLM. The LLM is a generator of structured narrative artifacts, not a rules engine and not the source of truth for gameplay state.

## Core rules

- All LLM responses must be JSON matching shared schemas
- The backend must never trust raw model output without validation
- The backend must supply legal-action boundaries explicitly
- The LLM must not invent state transitions, secret rules, or new options outside the allowed schema
- Retry and fallback behavior must be defined for invalid responses

## Prompt categories for MVP

### Pre-turn world update

Used to generate a concise framing update before the player chooses an action.

Inputs:

- scenario summary
- current public state
- relevant hidden state for the acting faction only
- recent turn history summary
- legal option metadata

Outputs:

- public summary paragraph
- private briefing paragraph if applicable
- short recommendation notes aligned to backend-provided option ids

### Post-resolution outcome narration

Used after the backend has already resolved action effects.

Inputs:

- resolved action ids
- deterministic resolution facts
- updated public state
- updated private state slices

Outputs:

- public outcome summary
- hidden developments per eligible faction
- consequence tags for UI grouping or future scenario hooks

### Fallback text generation

Used when the system needs acceptable copy quickly after retries fail.

Inputs:

- small structured fact set

Outputs:

- short plain-language summary with no extra invention

## Recommended response shapes

These names are conceptual and should map to Zod schemas in `packages/shared`.

### `TurnNarrativeResponse`

- `publicSummary`: string
- `privateBriefings`: array of faction-scoped briefing objects
- `recommendedOptionNotes`: array keyed by backend option id
- `toneTags`: array of strings

### `PostResolutionNarrativeResponse`

- `publicOutcome`: string
- `privateDevelopments`: array of faction-scoped updates
- `headline`: short string
- `followupSignals`: array of structured tags

## Data handling rules

### What the backend may provide

- bounded summaries of canonical state
- factual action and resolution data
- actor-specific private context when authorized
- schema, formatting, and style instructions

### What the backend should avoid providing

- raw internal state blobs if a summary is sufficient
- unnecessary hidden state for non-authorized factions
- ambiguous instructions like "decide what happens next"
- open-ended permission to create mechanics

## Validation and failure handling

### Validation steps

1. Parse JSON
2. Validate against the exact schema version
3. Enforce additional business rules not captured in schema alone
4. Sanitize strings for length, formatting, and prohibited content

### Retry strategy

- First failure: restate the schema and identify the mismatch category
- Second failure: reduce prompt complexity and request only required fields
- Final fallback: use deterministic backend-authored text templates

### Logging

Store enough metadata to debug prompt behavior without making prompt history the canonical game record.

- prompt type
- schema version
- model name
- validation result
- retry count

## Backend vs LLM authority examples

### Backend authoritative

- whether an action is legal
- whether a covert operation succeeds
- turn order
- resource changes
- escalation level changes
- victory or failure conditions

### LLM assistive only

- how a newspaper-style summary is worded
- how a private intelligence note is phrased
- how the option descriptions feel distinct and thematic
- how concise recommendation notes explain why visible backend-owned options differ strategically
- what narrative tags are attached within allowed taxonomy

## Security and consistency notes

- Never expose private faction state to the wrong player through prompt echoes
- Keep prompt templates versioned alongside schemas
- Assume the model may hallucinate certainty; backend copy may need to soften tone
- Recommendation percentages shown in UI must come from backend calculations, not model guesses

## Local evaluation workflow

- Prompt contract tests live in `apps/api/src/providers/openai/*.test.ts`
- Local fixture-based provider evaluations live in `apps/api/src/evals`
- Run `npm run eval:ai` from the repo root to execute the lightweight local AI regression harness
- Keep deterministic schema and scope checks separate from softer qualitative heuristics
