import type { IncomingMessage } from "node:http";
import type { AppConfig } from "../config.js";

export type RequestUserIdentity = {
  userId: string;
  displayName: string | null;
  source: "development_header" | "development_default";
};

export class RequestIdentityService {
  constructor(private readonly config: AppConfig["identity"]) {}

  resolveRequestIdentity(request: IncomingMessage): RequestUserIdentity {
    const headerUserId = this.readHeader(request, this.config.userIdHeader);
    const headerUserName = this.readHeader(request, this.config.userNameHeader);

    if (headerUserId) {
      return {
        userId: headerUserId,
        displayName: headerUserName,
        source: "development_header"
      };
    }

    return {
      userId: this.config.defaultUserId,
      displayName: "Local Dev User",
      source: "development_default"
    };
  }

  private readHeader(request: IncomingMessage, headerName: string): string | null {
    const value = request.headers[headerName.toLowerCase()];
    const normalized = Array.isArray(value) ? value[0] : value;
    const trimmed = String(normalized ?? "").trim();

    return trimmed.length > 0 ? trimmed : null;
  }
}
