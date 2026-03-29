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
LLM-facing behavior is currently served by the default mock provider selected with `AI_PROVIDER_MODE=mock`.

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

- `AI_PROVIDER_MODE=mock` is the current default
- `AI_PROVIDER_MODE=openai` enables the non-default OpenAI Responses API skeleton
- the backend still owns canonical state, legal actions, validation, and persistence
- future real LLM-backed providers can be added behind the same composition seam without changing the frontend API

### OpenAI provider skeleton

The repository now includes a server-side OpenAI provider module designed for future Responses API integration. It is not the default runtime path and is intentionally not yet production-complete.

Enable it only when you want to test that integration seam:

```bash
AI_PROVIDER_MODE=openai OPENAI_API_KEY=your_key OPENAI_MODEL=your_model npm run dev:api
```

Optional:

- `OPENAI_BASE_URL` defaults to `https://api.openai.com/v1`

Notes:

- all OpenAI secrets stay server-side in the API environment only
- normal local development does not require OpenAI credentials
- canonical state still remains backend-owned; the provider returns structured artifacts only

## Other commands

```bash
npm run build
npm run typecheck
```

## Notes

- The repository is set up as a workspace monorepo using npm workspaces.
- `@wargame/shared` is the place for cross-app contracts and schema validation.
- The backend supports both in-memory and PostgreSQL-backed persistence.
- Scenario definitions are still code-defined; the database currently stores canonical game sessions and turn history.
- The PostgreSQL schema is managed through SQL migrations in [apps/api/src/db/migrations/001_init.sql](/Users/joshanderson/Documents/Creative/Codex%20-%20ChatGPT%20Codex/wargame-app/apps/api/src/db/migrations/001_init.sql).
