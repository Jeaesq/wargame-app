# Wargame App

Minimal TypeScript monorepo scaffold for a turn-based geopolitical wargame.

## Structure

- `apps/web` - Next.js frontend shell
- `apps/api` - Node.js TypeScript backend shell
- `packages/shared` - shared types and Zod schemas
- `docs` - product and architecture notes

## Requirements

- Node.js 20+
- npm 10+

## Getting started

```bash
npm install
```

## Run the apps

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

## Other commands

```bash
npm run build
npm run typecheck
```

## Notes

- The repository is set up as a workspace monorepo using npm workspaces.
- `@wargame/shared` is the place for cross-app contracts and schema validation.
- The frontend and backend are intentionally minimal.
- No game logic, persistence, or LLM orchestration has been implemented yet.
