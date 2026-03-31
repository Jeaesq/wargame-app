# Developer Validation

## Checklist

- Run `npm run build`
- Run `npm run typecheck`
- Run `npm run test -w @wargame/api`
- In memory mode, verify you can:
  - create a new session
  - open that session overview
  - submit one turn
  - see the bot follow-up turn in history
  - ask the advisor a question and receive a structured answer
- If working on persistence, also verify:
  - PostgreSQL migrations run cleanly
  - a created session survives API restart in `PERSISTENCE_MODE=postgres`

## Scope of the automated backend coverage

The lightweight API test suite currently protects these MVP flows:

- create session
- create seeded debug session
- load session overview
- submit turn
- persist bot turn in turn history
- advisor response contract validation
- replay deterministic ids and counters across equivalent seeded runs

The tests intentionally run against the HTTP API in memory mode so they stay fast and exercise the real route, service, provider, and validation stack without heavier infrastructure.

## Replay debug checks

- Local usage is documented in [replay-debugging.md](/Users/joshanderson/Documents/Creative/Codex - ChatGPT Codex/wargame-app/docs/replay-debugging.md)
- To validate the seeded path locally, run:
  - `npm run test -w @wargame/api`
  - create two sessions with the same `debug.seed`
  - submit the same first move in both sessions
  - confirm the canonical ids and `sessionConfig.debug.streamCounters` stay aligned
