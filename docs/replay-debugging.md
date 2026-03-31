# Seeded Replay And Debug Mode

The normal game flow stays unchanged. Seeded replay is an API-level developer tool that lets the backend generate reproducible session-scoped IDs and persist the deterministic stream state inside the canonical session record.

## What it does

- keeps the backend as the owner of deterministic randomness
- stores replay settings in `game.sessionConfig.debug`
- supports:
  - explicit seeded runs for side-by-side comparisons
  - deterministic debug mode without a supplied seed, which auto-generates and persists one
- leaves normal sessions on the existing non-debug path

## Create a seeded session locally

```bash
curl -s -X POST http://localhost:4000/games \
  -H "Content-Type: application/json" \
  --data '{
    "scenarioId": "scenario-cold-war-berlin-mvp",
    "mode": "solo",
    "targetGameLength": "medium",
    "debug": {
      "deterministicMode": true,
      "seed": "cold-war-replay-001"
    },
    "players": [
      {
        "name": "Player One",
        "role": "human",
        "factionId": "faction-usa"
      }
    ]
  }'
```

## Auto-generate a persisted debug seed

```json
{
  "debug": {
    "deterministicMode": true
  }
}
```

The backend will persist the generated seed in `sessionConfig.debug.seed`, so you can inspect the saved session and reuse that same seed in a later comparison run.

## What stays reproducible

- game ids in seeded sessions
- generated player ids
- advisor answer ids
- submitted action ids
- turn resolution ids
- deterministic stream counters persisted with the session

This is most useful when comparing:

- prompt revisions against the same starting session seed
- two local branches under the same turn inputs
- AI/provider regressions where you want stable canonical bookkeeping

Provider text can still differ if the provider itself is nondeterministic, so treat seeded replay as a controlled backend comparison tool rather than a full transcript lock.
