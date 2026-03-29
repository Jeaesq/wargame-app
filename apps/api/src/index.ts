import { createServer } from "node:http";
import { appManifest } from "@wargame/shared";
import { createApp } from "./app.js";
import { appConfig } from "./config.js";

const app = createApp();

const server = createServer(async (request, response) => {
  await app.handle(request, response);
});

server.listen(appConfig.port, () => {
  console.log(`${appManifest.name} API listening on http://localhost:${appConfig.port}`);
});
