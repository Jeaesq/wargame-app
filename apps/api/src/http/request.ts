import type { IncomingMessage } from "node:http";
import { ValidationError } from "../errors/app-error.js";

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const body = Buffer.concat(chunks).toString("utf8").trim();

  if (body.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}
