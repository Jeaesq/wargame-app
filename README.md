# Wargame App

TypeScript monorepo for a turn-based geopolitical wargame prototype with a Next.js frontend, a Node.js backend, shared Zod contracts, and optional PostgreSQL persistence.

## Structure

- `apps/web` - Next.js frontend shell
- `apps/api` - Node.js TypeScript backend
- `packages/shared` - shared types and Zod schemas
- `docs` - product and architecture notes

## Requirements

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
```

## Run in memory mode

This is the default mode and requires no database:

Start both apps together:

```bash
npm run dev
```

Or start them separately in two terminals:

```bash
npm run dev:web
```

```bash
npm run dev:api
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`

The web app expects the API at `http://localhost:4000` by default. If you need a different backend URL for the Next.js server, set `API_BASE_URL` before starting `dev:web`.

Example:

```bash
API_BASE_URL=http://localhost:4000 npm run dev:web
```

## Run with PostgreSQL

The backend supports `PERSISTENCE_MODE=postgres` for database-backed session and turn persistence.
LLM-facing behavior is currently served by mock providers by default.

### 1. Start PostgreSQL locally

Use Docker Compose from the repository root:

```bash
docker compose up -d postgres
```

This starts PostgreSQL on `localhost:5432` with:

- database: `wargame`
- user: `wargame`
- password: `wargame`

### 2. Run the database migration

```bash
PERSISTENCE_MODE=postgres DATABASE_URL=postgres://wargame:wargame@localhost:5432/wargame npm run db:migrate -w @wargame/api
```

### 3. Start the app against PostgreSQL

Start both apps:

```bash
PERSISTENCE_MODE=postgres DATABASE_URL=postgres://wargame:wargame@localhost:5432/wargame npm run dev
```

Or start just the API:

```bash
PERSISTENCE_MODE=postgres DATABASE_URL=postgres://wargame:wargame@localhost:5432/wargame npm run dev:api
```

If `PERSISTENCE_MODE=postgres` is selected without `DATABASE_URL`, the API exits immediately with a clear configuration error.

## Provider mode

The backend now routes turn narration support, bot decision support, and advisor answers through a provider layer.

- `ADVISOR_PROVIDER=mock` is the default
- `TURN_PROVIDER=mock` is the default
- `BOT_PROVIDER=mock` is the default
- `ADVISOR_PROVIDER=openai` enables the OpenAI advisor path without changing turn resolution
- `TURN_PROVIDER=openai` is optional and non-default
- the backend still owns canonical state, legal actions, validation, and persistence
- future real LLM-backed providers can be added behind the same composition seam without changing the frontend API

### OpenAI provider setup

The repository includes a server-side OpenAI provider path for the API. It is optional, non-default, and all OpenAI credentials stay on the backend only.

1. Create `apps/api/.env.local` with your API-only settings:

```bash
cat <<'EOF' > apps/api/.env.local
ADVISOR_PROVIDER=openai
TURN_PROVIDER=mock
BOT_PROVIDER=mock
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
EOF
```

2. Start the API or the full app from the repository root:

```bash
npm run dev:api
```

```bash
npm run dev
```

3. Optional: override values directly in the shell for one-off runs:

```bash
ADVISOR_PROVIDER=openai TURN_PROVIDER=mock BOT_PROVIDER=mock OPENAI_API_KEY=your_openai_api_key OPENAI_MODEL=gpt-4.1-mini npm run dev:api
```

Optional backend-only setting:

- `OPENAI_BASE_URL` defaults to `https://api.openai.com/v1`

Notes:

- if any provider is set to `openai` without `OPENAI_API_KEY` or `OPENAI_MODEL`, the API exits immediately with a clear configuration error
- all OpenAI secrets stay server-side in `apps/api/.env.local` or the API process environment only
- normal local development does not require OpenAI credentials
- canonical state still remains backend-owned; the provider returns structured artifacts only
- normal gameplay stays on mock unless you explicitly switch a provider

## Other commands

```bash
npm run build
npm run typecheck
```

Backend API tests:

```bash
npm run test -w @wargame/api
```

## Notes

- The repository is set up as a workspace monorepo using npm workspaces.
- `@wargame/shared` is the place for cross-app contracts and schema validation.
- The backend supports both in-memory and PostgreSQL-backed persistence.
- Scenario definitions are still code-defined; the database currently stores canonical game sessions and turn history.
- The PostgreSQL schema is managed through SQL migrations in [apps/api/src/db/migrations/001_init.sql](/Users/joshanderson/Documents/Creative/Codex%20-%20ChatGPT%20Codex/wargame-app/apps/api/src/db/migrations/001_init.sql).
- A concise developer validation checklist lives in [docs/developer-validation.md](/Users/joshanderson/Documents/Creative/Codex%20-%20ChatGPT%20Codex/wargame-app/docs/developer-validation.md).
