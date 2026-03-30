# Cloud Run Deployment

This app keeps OpenAI credentials on the backend only. The frontend should never receive `OPENAI_API_KEY`, `OPENAI_MODEL`, or any other backend secret.

This guide focuses on deploying the API service to Google Cloud Run with optional OpenAI-backed advisor support.

## Backend environment variables

The API service reads these environment variables at runtime:

- `PORT`
  Cloud Run sets this automatically. The API already defaults to `4000` locally and respects the Cloud Run `PORT` value in production.
- `PERSISTENCE_MODE`
  Use `memory` for ephemeral demo deployments or `postgres` for persistent sessions.
- `DATABASE_URL`
  Required when `PERSISTENCE_MODE=postgres`.
- `PG_POOL_MAX`
  Optional PostgreSQL pool size override. Defaults to `10`.
- `ADVISOR_PROVIDER`
  `mock` or `openai`. Default is `mock`.
- `TURN_PROVIDER`
  `mock` or `openai`. Default is `mock`.
- `BOT_PROVIDER`
  `mock` or `openai`. Default is `mock`. Current recommended production setting is still `mock`.
- `OPENAI_API_KEY`
  Required if any provider is set to `openai`.
- `OPENAI_MODEL`
  Required if any provider is set to `openai`.
- `OPENAI_BASE_URL`
  Optional. Defaults to `https://api.openai.com/v1`.

Recommended production values for advisor-only OpenAI usage:

```bash
PERSISTENCE_MODE=postgres
ADVISOR_PROVIDER=openai
TURN_PROVIDER=mock
BOT_PROVIDER=mock
OPENAI_MODEL=gpt-4.1-mini
PG_POOL_MAX=10
```

## Local setup before deploying

1. Create `apps/api/.env.local` for API-only local development.
2. Keep OpenAI turned off unless you are actively testing it.

Example local mock-friendly setup:

```bash
PERSISTENCE_MODE=memory
ADVISOR_PROVIDER=mock
TURN_PROVIDER=mock
BOT_PROVIDER=mock
```

Example local advisor-on-OpenAI setup:

```bash
PERSISTENCE_MODE=memory
ADVISOR_PROVIDER=openai
TURN_PROVIDER=mock
BOT_PROVIDER=mock
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
```

3. Start the API with `npm run dev:api` or the full app with `npm run dev`.
4. Confirm the backend logs show the expected provider selection on startup.

## Cloud Run deployment flow

### 1. Build the API image

This repository does not yet include a dedicated Cloud Run Dockerfile, so build and deploy using your preferred container workflow as long as the final container starts the API with:

```bash
npm run build -w @wargame/shared
npm run build -w @wargame/api
npm run start -w @wargame/api
```

The production container must expose the API service and allow Cloud Run to provide `PORT`.

### 2. Create secrets in Secret Manager

Store sensitive values in Secret Manager instead of checking them into source control or setting them as plain environment variables.

Example secrets:

- `wargame-openai-api-key`
- `wargame-database-url`

### 3. Deploy the API service

Use non-secret environment variables for provider selection and runtime mode:

```bash
gcloud run deploy wargame-api \
  --image YOUR_IMAGE_URL \
  --region YOUR_REGION \
  --set-env-vars PERSISTENCE_MODE=postgres,ADVISOR_PROVIDER=openai,TURN_PROVIDER=mock,BOT_PROVIDER=mock,OPENAI_MODEL=gpt-4.1-mini,PG_POOL_MAX=10 \
  --set-secrets OPENAI_API_KEY=wargame-openai-api-key:latest,DATABASE_URL=wargame-database-url:latest
```

If you are not using PostgreSQL yet, you can omit `DATABASE_URL` and set:

```bash
--set-env-vars PERSISTENCE_MODE=memory,ADVISOR_PROVIDER=openai,TURN_PROVIDER=mock,BOT_PROVIDER=mock,OPENAI_MODEL=gpt-4.1-mini
```

### 4. Verify the running configuration

After deployment:

1. Open Cloud Run logs.
2. Confirm startup logs show the expected provider selection.
3. Confirm advisor requests use the OpenAI path when `ADVISOR_PROVIDER=openai`.
4. Confirm turn resolution still uses the mock path unless `TURN_PROVIDER=openai` is explicitly enabled.

### 5. Connect the frontend to the deployed API

The frontend should only talk to the API base URL. It must not receive backend secrets.

For local frontend testing against deployed API:

```bash
API_BASE_URL=https://YOUR_API_SERVICE_URL npm run dev:web
```

## Safety notes

- Do not place `OPENAI_API_KEY` in frontend env files.
- Do not expose `OPENAI_API_KEY` through Next.js public env vars.
- Do not commit `apps/api/.env.local`.
- If `ADVISOR_PROVIDER=openai` is configured without `OPENAI_API_KEY` or `OPENAI_MODEL`, the API exits immediately with a clear configuration error.
- Keep `TURN_PROVIDER=mock` and `BOT_PROVIDER=mock` unless you are intentionally testing those experimental paths.
