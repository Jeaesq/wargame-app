import type { ServerResponse } from "node:http";
import { appManifest } from "@wargame/shared";
import { AppError, isAppError } from "../errors/app-error.js";

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  data: unknown
): void {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}

export function sendError(response: ServerResponse, error: unknown): void {
  const appError = isAppError(error)
    ? error
    : new AppError(500, "INTERNAL_ERROR", "An unexpected error occurred.");

  sendJson(response, appError.statusCode, {
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details
    },
    meta: {
      service: appManifest.name
    }
  });
}
