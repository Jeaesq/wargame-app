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
- load session overview
- submit turn
- persist bot turn in turn history
- advisor response contract validation

The tests intentionally run against the HTTP API in memory mode so they stay fast and exercise the real route, service, provider, and validation stack without heavier infrastructure.
