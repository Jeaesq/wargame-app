import { z } from "zod";

const persistenceModeSchema = z.enum(["memory", "postgres"]);
const providerModeSchema = z.enum(["mock", "openai"]);

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  PERSISTENCE_MODE: persistenceModeSchema.default("memory"),
  AI_PROVIDER_MODE: providerModeSchema.default("mock"),
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
    mode: ProviderMode;
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

function parseEnvironment() {
  return envSchema.parse(process.env);
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

  if (env.AI_PROVIDER_MODE === "openai" && !env.OPENAI_API_KEY) {
    throw new ConfigError(
      "AI_PROVIDER_MODE=openai requires OPENAI_API_KEY to be set."
    );
  }

  if (env.AI_PROVIDER_MODE === "openai" && !env.OPENAI_MODEL) {
    throw new ConfigError(
      "AI_PROVIDER_MODE=openai requires OPENAI_MODEL to be set."
    );
  }

  cachedConfig = {
    port: env.PORT,
    persistence: {
      mode: env.PERSISTENCE_MODE
    },
    providers: {
      mode: env.AI_PROVIDER_MODE,
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
