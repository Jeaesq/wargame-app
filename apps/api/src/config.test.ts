import assert from "node:assert/strict";
import test from "node:test";
import {
  ConfigError,
  getAppConfig,
  resetAppConfigCache
} from "./config.js";

const trackedEnvironmentKeys = [
  "PORT",
  "PERSISTENCE_MODE",
  "AI_PROVIDER",
  "AI_PROVIDER_MODE",
  "DATABASE_URL",
  "PG_POOL_MAX",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_BASE_URL",
  "WARGAME_SKIP_API_ENV_FILES"
] as const;

function withEnvironment(
  overrides: Partial<Record<(typeof trackedEnvironmentKeys)[number], string | undefined>>,
  run: () => void | Promise<void>
) {
  const originalEnvironment = new Map<string, string | undefined>();

  for (const key of trackedEnvironmentKeys) {
    originalEnvironment.set(key, process.env[key]);
  }

  for (const key of trackedEnvironmentKeys) {
    delete process.env[key];
  }

  process.env.WARGAME_SKIP_API_ENV_FILES = "true";

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }

  resetAppConfigCache();

  return Promise.resolve(run()).finally(() => {
    for (const key of trackedEnvironmentKeys) {
      const originalValue = originalEnvironment.get(key);

      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }

    resetAppConfigCache();
  });
}

test("defaults to the mock provider when AI_PROVIDER is unset", async () => {
  await withEnvironment({}, () => {
    const config = getAppConfig();

    assert.equal(config.providers.mode, "mock");
    assert.equal(config.providers.openai, null);
  });
});

test("accepts AI_PROVIDER=openai when required OpenAI config is present", async () => {
  await withEnvironment(
    {
      AI_PROVIDER: "openai",
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "gpt-4.1-mini"
    },
    () => {
      const config = getAppConfig();

      assert.equal(config.providers.mode, "openai");
      assert.deepEqual(config.providers.openai, {
        apiKey: "test-key",
        model: "gpt-4.1-mini",
        baseUrl: "https://api.openai.com/v1"
      });
    }
  );
});

test("fails clearly when AI_PROVIDER=openai is missing OPENAI_API_KEY", async () => {
  await withEnvironment(
    {
      AI_PROVIDER: "openai",
      OPENAI_MODEL: "gpt-4.1-mini"
    },
    () => {
      assert.throws(
        () => getAppConfig(),
        new ConfigError("AI_PROVIDER=openai requires OPENAI_API_KEY to be set.")
      );
    }
  );
});

test("fails clearly when AI_PROVIDER=openai is missing OPENAI_MODEL", async () => {
  await withEnvironment(
    {
      AI_PROVIDER: "openai",
      OPENAI_API_KEY: "test-key"
    },
    () => {
      assert.throws(
        () => getAppConfig(),
        new ConfigError("AI_PROVIDER=openai requires OPENAI_MODEL to be set.")
      );
    }
  );
});

test("accepts legacy AI_PROVIDER_MODE when AI_PROVIDER is not set", async () => {
  await withEnvironment(
    {
      AI_PROVIDER_MODE: "openai",
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "gpt-4.1-mini"
    },
    () => {
      const config = getAppConfig();

      assert.equal(config.providers.mode, "openai");
    }
  );
});

test("fails clearly when AI_PROVIDER and AI_PROVIDER_MODE conflict", async () => {
  await withEnvironment(
    {
      AI_PROVIDER: "mock",
      AI_PROVIDER_MODE: "openai"
    },
    () => {
      assert.throws(
        () => getAppConfig(),
        new ConfigError("AI_PROVIDER=mock conflicts with AI_PROVIDER_MODE=openai.")
      );
    }
  );
});
