# AI Evaluations

This project now includes a lightweight local evaluation harness for the provider layer.

It is intentionally small:

- reusable fixture inputs live in `apps/api/src/evals/fixtures.ts`
- deterministic and qualitative checks live in `apps/api/src/evals/checks.ts`
- a local CLI runner lives in `apps/api/src/evals/run-evals.ts`

## What it covers

### Advisor checks

- answer schema validity through shared Zod schemas
- visibility compliance, including recommended option ids staying inside visible options
- hidden-information leakage checks using fixture-specific forbidden terms
- lightweight quality signals such as topical specificity, pacing fit, usefulness, and low-filler responses

### Turn-resolution checks

- turn artifact schema validity through shared Zod schemas
- `recommendedNextOptionIds` staying inside backend-supplied next options
- private summary and private update scope staying inside the acting faction/player
- lightweight plausibility signals such as option diversity, pacing fit, escalation labeling, end-state plausibility, and low-filler narration

## How to run locally

From the repo root:

```bash
npm run eval:ai
```

To run the same fixture harness against the OpenAI provider path instead of the local mocks:

```bash
AI_EVAL_PROVIDER=openai ADVISOR_PROVIDER=openai TURN_PROVIDER=openai OPENAI_API_KEY=... OPENAI_MODEL=... npm run eval:ai
```

Or from the API workspace:

```bash
npm run eval -w @wargame/api
```

The runner uses the local mock advisor and mock turn providers by default so it stays offline and fast. If `AI_EVAL_PROVIDER=openai` is set, it exercises the OpenAI provider path with the same fixtures. It prints:

- deterministic issues: hard contract failures that should be fixed before trusting the output
- qualitative notes: softer heuristics that are useful when reviewing prompt or provider changes

The command exits non-zero only when deterministic issues are found.

## Relationship to existing tests

- `npm test -w @wargame/api` remains the main automated test suite
- prompt contract tests still live alongside the OpenAI prompt builders
- the eval harness complements those tests by exercising realistic fixture inputs and checking output quality signals

## Extending the fixtures

When adding a new fixture:

1. Add a realistic provider input to `apps/api/src/evals/fixtures.ts`
2. Add fixture-specific expectations:
   - allowed option ids
   - allowed private scope
   - forbidden hidden-only phrases
   - topical terms that should appear in grounded answers
   - optional pacing, usefulness, diversity, or end-state signals for softer regression detection
3. Re-run `npm run eval:ai`

Keep fixtures focused on realistic crisis states and concrete user questions. Prefer a few strong cases over a large synthetic corpus.
