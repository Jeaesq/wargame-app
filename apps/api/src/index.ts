import { createServer } from "node:http";
import { appManifest } from "@wargame/shared";
import { createApp } from "./app.js";
import { ConfigError, getAppConfig } from "./config.js";
import { logInfo } from "./logger.js";

try {
  const appConfig = getAppConfig();
  const app = createApp(appConfig);

  const server = createServer(async (request, response) => {
    await app.handle(request, response);
  });

  server.listen(appConfig.port, () => {
    logInfo(`${appManifest.name} API listening.`, {
      url: `http://localhost:${appConfig.port}`,
      advisorProvider: appConfig.providers.advisor,
      turnProvider: appConfig.providers.turn,
      botProvider: appConfig.providers.bot
    });
  });
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`Configuration error: ${error.message}`);
    process.exit(1);
  }

  throw error;
}
