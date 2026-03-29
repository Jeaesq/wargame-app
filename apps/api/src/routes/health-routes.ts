import { appManifest, healthStatusSchema } from "@wargame/shared";
import type { Router } from "../http/router.js";
import { sendJson } from "../http/response.js";

export function registerHealthRoutes(router: Router): void {
  router.register("GET", "/health", ({ response }) => {
    const payload = healthStatusSchema.parse({
      name: appManifest.name,
      status: "ok",
      message: "API backend skeleton is running."
    });

    sendJson(response, 200, payload);
  });
}
