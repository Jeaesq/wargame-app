import { Router, type ApiServices } from "./http/router.js";
import { createApiServices } from "./composition.js";
import { registerAdvisorRoutes } from "./routes/advisor-routes.js";
import { registerGameRoutes } from "./routes/games-routes.js";
import { registerHealthRoutes } from "./routes/health-routes.js";
import { registerTurnRoutes } from "./routes/turns-routes.js";

export function createApp() {
  const services: ApiServices = createApiServices();

  const router = new Router(services);

  registerHealthRoutes(router);
  registerGameRoutes(router);
  registerTurnRoutes(router);
  registerAdvisorRoutes(router);

  return router;
}
