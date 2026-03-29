# Architecture Notes

## Workspace layout

- `apps/web`: Next.js frontend shell
- `apps/api`: Node.js TypeScript backend shell
- `packages/shared`: shared types and validation schemas
- `docs`: product and architecture notes

## Early boundaries

- Backend remains the source of truth for state and rules
- Shared package holds contracts that both apps depend on
- LLM integration should stay behind validated backend interfaces
- Persistence, legal move generation, and turn resolution will live in the API later
