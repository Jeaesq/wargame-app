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

export function beginEventStream(response: ServerResponse): void {
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
}

export function sendEventStreamMessage(
  response: ServerResponse,
  event: string,
  data: unknown
): void {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}
