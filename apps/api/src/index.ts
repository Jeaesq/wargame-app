import { createServer } from "node:http";
import { appManifest } from "@wargame/shared";
import { createApp } from "./app.js";
import { ConfigError, getAppConfig } from "./config.js";

try {
  const appConfig = getAppConfig();
  const app = createApp(appConfig);

  const server = createServer(async (request, response) => {
    await app.handle(request, response);
  });

  server.listen(appConfig.port, () => {
    console.log(
      `${appManifest.name} API listening on http://localhost:${appConfig.port}`
    );
  });
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`Configuration error: ${error.message}`);
    process.exit(1);
  }

  throw error;
}
