import { createApiServices } from "./composition.js";
import { getAppConfig, type AppConfig } from "./config.js";
import { Router, type ApiServices } from "./http/router.js";
import { registerAdvisorRoutes } from "./routes/advisor-routes.js";
import { registerGameRoutes } from "./routes/games-routes.js";
import { registerHealthRoutes } from "./routes/health-routes.js";
import { registerTurnRoutes } from "./routes/turns-routes.js";

export function createApp(config: AppConfig = getAppConfig()) {
  const services: ApiServices = createApiServices(config);

  const router = new Router(services);

  registerHealthRoutes(router);
  registerGameRoutes(router);
  registerTurnRoutes(router);
  registerAdvisorRoutes(router);

  return router;
}
