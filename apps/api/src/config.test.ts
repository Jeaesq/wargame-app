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
  "ADVISOR_PROVIDER",
  "TURN_PROVIDER",
  "BOT_PROVIDER",
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

    assert.equal(config.providers.advisor, "mock");
    assert.equal(config.providers.turn, "mock");
    assert.equal(config.providers.bot, "mock");
    assert.equal(config.providers.openai, null);
  });
});

test("accepts split provider config when required OpenAI config is present", async () => {
  await withEnvironment(
    {
      ADVISOR_PROVIDER: "openai",
      TURN_PROVIDER: "mock",
      BOT_PROVIDER: "mock",
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "gpt-4.1-mini"
    },
    () => {
      const config = getAppConfig();

      assert.equal(config.providers.advisor, "openai");
      assert.equal(config.providers.turn, "mock");
      assert.equal(config.providers.bot, "mock");
      assert.deepEqual(config.providers.openai, {
        apiKey: "test-key",
        model: "gpt-4.1-mini",
        baseUrl: "https://api.openai.com/v1"
      });
    }
  );
});

test("fails clearly when any OpenAI provider is missing OPENAI_API_KEY", async () => {
  await withEnvironment(
    {
      ADVISOR_PROVIDER: "openai",
      OPENAI_MODEL: "gpt-4.1-mini"
    },
    () => {
      assert.throws(
        () => getAppConfig(),
        new ConfigError(
          "OpenAI provider configuration requires OPENAI_API_KEY to be set."
        )
      );
    }
  );
});

test("fails clearly when any OpenAI provider is missing OPENAI_MODEL", async () => {
  await withEnvironment(
    {
      TURN_PROVIDER: "openai",
      OPENAI_API_KEY: "test-key"
    },
    () => {
      assert.throws(
        () => getAppConfig(),
        new ConfigError(
          "OpenAI provider configuration requires OPENAI_MODEL to be set."
        )
      );
    }
  );
});

test("accepts legacy AI_PROVIDER_MODE when split provider envs are not set", async () => {
  await withEnvironment(
    {
      AI_PROVIDER_MODE: "openai",
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "gpt-4.1-mini"
    },
    () => {
      const config = getAppConfig();

      assert.equal(config.providers.advisor, "openai");
      assert.equal(config.providers.turn, "openai");
      assert.equal(config.providers.bot, "mock");
    }
  );
});

test("fails clearly when ADVISOR_PROVIDER and legacy AI_PROVIDER_MODE conflict", async () => {
  await withEnvironment(
    {
      ADVISOR_PROVIDER: "mock",
      AI_PROVIDER_MODE: "openai"
    },
    () => {
      assert.throws(
        () => getAppConfig(),
        new ConfigError(
          "ADVISOR_PROVIDER=mock conflicts with legacy AI_PROVIDER_MODE=openai."
        )
      );
    }
  );
});
