import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError, z } from "zod";

const persistenceModeSchema = z.enum(["memory", "postgres"]);
const providerModeSchema = z.enum(["mock", "openai"]);
const apiRootDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  PERSISTENCE_MODE: persistenceModeSchema.default("memory"),
  ADVISOR_PROVIDER: providerModeSchema.optional(),
  TURN_PROVIDER: providerModeSchema.optional(),
  BOT_PROVIDER: providerModeSchema.optional(),
  AI_PROVIDER: providerModeSchema.optional(),
  AI_PROVIDER_MODE: providerModeSchema.optional(),
  DATABASE_URL: z.string().min(1).optional(),
  PG_POOL_MAX: z.coerce.number().int().positive().default(10),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1")
});

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export type PersistenceMode = z.infer<typeof persistenceModeSchema>;
export type ProviderMode = z.infer<typeof providerModeSchema>;

export type AppConfig = {
  port: number;
  persistence: {
    mode: PersistenceMode;
  };
  providers: {
    advisor: ProviderMode;
    turn: ProviderMode;
    bot: ProviderMode;
    openai: {
      apiKey: string;
      model: string;
      baseUrl: string;
    } | null;
  };
  database: {
    url: string;
    poolMax: number;
  } | null;
};

let cachedConfig: AppConfig | null = null;
let apiEnvironmentLoaded = false;

function ensureApiEnvironmentLoaded() {
  if (apiEnvironmentLoaded || process.env.WARGAME_SKIP_API_ENV_FILES === "true") {
    apiEnvironmentLoaded = true;
    return;
  }

  const fileEnvironment = {
    ...readEnvironmentFile(path.join(apiRootDirectory, ".env")),
    ...readEnvironmentFile(path.join(apiRootDirectory, ".env.local"))
  };

  for (const [key, value] of Object.entries(fileEnvironment)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  apiEnvironmentLoaded = true;
}

function readEnvironmentFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {};
  }

  const fileContents = readFileSync(filePath, "utf8");
  const environment: Record<string, string> = {};

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ")
      ? line.slice("export ".length)
      : line;
    const separatorIndex = normalizedLine.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();

    if (!key) {
      continue;
    }

    environment[key] = parseEnvironmentValue(rawValue);
  }

  return environment;
}

function parseEnvironmentValue(rawValue: string): string {
  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    return rawValue.slice(1, -1);
  }

  return rawValue;
}

function resolveProviderMode(
  provider: ProviderMode | undefined,
  legacyProvider: ProviderMode | undefined,
  label: string
): ProviderMode {
  if (provider && legacyProvider && provider !== legacyProvider) {
    throw new ConfigError(
      `${label}=${provider} conflicts with legacy AI_PROVIDER_MODE=${legacyProvider}.`
    );
  }

  return provider ?? legacyProvider ?? "mock";
}

function parseEnvironment() {
  ensureApiEnvironmentLoaded();

  try {
    const env = envSchema.parse(process.env);
    const legacyProvider = env.AI_PROVIDER ?? env.AI_PROVIDER_MODE;

    return {
      ...env,
      ADVISOR_PROVIDER: resolveProviderMode(
        env.ADVISOR_PROVIDER,
        legacyProvider,
        "ADVISOR_PROVIDER"
      ),
      TURN_PROVIDER: resolveProviderMode(
        env.TURN_PROVIDER,
        legacyProvider,
        "TURN_PROVIDER"
      ),
      BOT_PROVIDER: resolveProviderMode(env.BOT_PROVIDER, undefined, "BOT_PROVIDER")
    };
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }

    if (error instanceof ZodError) {
      throw new ConfigError(
        `Invalid API configuration: ${error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ")}`
      );
    }

    throw error;
  }
}

export function getRequiredDatabaseConfig(): NonNullable<AppConfig["database"]> {
  const env = parseEnvironment();

  if (!env.DATABASE_URL) {
    throw new ConfigError(
      "DATABASE_URL must be set to use PostgreSQL-backed persistence."
    );
  }

  return {
    url: env.DATABASE_URL,
    poolMax: env.PG_POOL_MAX
  };
}

export function getAppConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const env = parseEnvironment();

  if (env.PERSISTENCE_MODE === "postgres" && !env.DATABASE_URL) {
    throw new ConfigError(
      "PERSISTENCE_MODE=postgres requires DATABASE_URL to be set."
    );
  }

  const anyOpenAIProviderEnabled =
    env.ADVISOR_PROVIDER === "openai" ||
    env.TURN_PROVIDER === "openai" ||
    env.BOT_PROVIDER === "openai";

  if (anyOpenAIProviderEnabled && !env.OPENAI_API_KEY) {
    throw new ConfigError(
      "OpenAI provider configuration requires OPENAI_API_KEY to be set."
    );
  }

  if (anyOpenAIProviderEnabled && !env.OPENAI_MODEL) {
    throw new ConfigError(
      "OpenAI provider configuration requires OPENAI_MODEL to be set."
    );
  }

  cachedConfig = {
    port: env.PORT,
    persistence: {
      mode: env.PERSISTENCE_MODE
    },
    providers: {
      advisor: env.ADVISOR_PROVIDER,
      turn: env.TURN_PROVIDER,
      bot: env.BOT_PROVIDER,
      openai:
        env.OPENAI_API_KEY && env.OPENAI_MODEL
          ? {
              apiKey: env.OPENAI_API_KEY,
              model: env.OPENAI_MODEL,
              baseUrl: env.OPENAI_BASE_URL
            }
          : null
    },
    database: env.DATABASE_URL
      ? {
          url: env.DATABASE_URL,
          poolMax: env.PG_POOL_MAX
        }
      : null
  };

  return cachedConfig;
}

export function resetAppConfigCache() {
  cachedConfig = null;
  apiEnvironmentLoaded = false;
}
