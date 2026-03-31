import { createHash, randomUUID } from "node:crypto";
import {
  sessionDebugConfigSchema,
  type CreateGameDebugConfig,
  type Game,
  type SessionDebugConfig
} from "@wargame/shared";

type CreateSessionDebugConfigInput = {
  scenarioId: string;
  mode: Game["mode"];
  ownerUserId: string;
  createdAt: string;
  debug?: CreateGameDebugConfig;
};

type GenerateSessionScopedIdInput = {
  sessionConfig: Game["sessionConfig"];
  stream: string;
};

const defaultDebugConfig: SessionDebugConfig = {
  mode: "off",
  seed: null,
  streamCounters: {}
};

function createDeterministicUuid(seed: string, stream: string, counter: number): string {
  const digest = createHash("sha256")
    .update(`${seed}:${stream}:${counter}`)
    .digest("hex");
  const hex = digest.slice(0, 32);
  const variantNibble = ((Number.parseInt(hex[16] ?? "0", 16) & 0x3) | 0x8).toString(16);

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variantNibble}${hex.slice(17, 20)}`,
    hex.slice(20, 32)
  ].join("-");
}

function createGeneratedDebugSeed(input: Omit<CreateSessionDebugConfigInput, "debug">): string {
  const digest = createHash("sha256")
    .update(
      JSON.stringify({
        scenarioId: input.scenarioId,
        mode: input.mode,
        ownerUserId: input.ownerUserId,
        createdAt: input.createdAt
      })
    )
    .digest("hex");

  return `debug-${digest.slice(0, 16)}`;
}

export function createSessionDebugConfig(
  input: CreateSessionDebugConfigInput
): SessionDebugConfig {
  const deterministicMode = Boolean(input.debug?.deterministicMode || input.debug?.seed);

  if (!deterministicMode) {
    return defaultDebugConfig;
  }

  return sessionDebugConfigSchema.parse({
    mode: "seeded",
    seed: input.debug?.seed?.trim() || createGeneratedDebugSeed(input),
    streamCounters: {}
  });
}

export function generateSessionScopedId(
  input: GenerateSessionScopedIdInput
): {
  id: string;
  sessionConfig: Game["sessionConfig"];
} {
  const debugConfig = sessionDebugConfigSchema.parse(input.sessionConfig.debug);

  if (debugConfig.mode !== "seeded" || !debugConfig.seed) {
    return {
      id: randomUUID(),
      sessionConfig: input.sessionConfig
    };
  }

  const streamCount = debugConfig.streamCounters[input.stream] ?? 0;

  return {
    id: createDeterministicUuid(debugConfig.seed, input.stream, streamCount),
    sessionConfig: {
      ...input.sessionConfig,
      debug: {
        ...debugConfig,
        streamCounters: {
          ...debugConfig.streamCounters,
          [input.stream]: streamCount + 1
        }
      }
    }
  };
}
