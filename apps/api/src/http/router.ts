import type { IncomingMessage, ServerResponse } from "node:http";
import { NotFoundError } from "../errors/app-error.js";
import { sendError } from "./response.js";

type HttpMethod = "GET" | "POST";

type RouteMatch = {
  params: Record<string, string>;
  pathname: string;
};

export type ApiServices = {
  advisorQaService: import("../services/advisor-qa-service.js").AdvisorQaService;
  gameSessionService: import("../services/game-session-service.js").GameSessionService;
  scenarioRepository: import("../repositories/contracts.js").ScenarioRepository;
  turnSubmissionService: import("../services/turn-submission-service.js").TurnSubmissionService;
};

export type RouteContext = {
  request: IncomingMessage;
  response: ServerResponse;
  params: Record<string, string>;
  pathname: string;
  url: URL;
  services: ApiServices;
};

type RouteDefinition = {
  method: HttpMethod;
  pattern: string;
  handler: (context: RouteContext) => Promise<void> | void;
};

function matchRoute(pattern: string, pathname: string): RouteMatch | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (const [index, patternPart] of patternParts.entries()) {
    const pathPart = pathParts[index];

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return {
    params,
    pathname
  };
}

export class Router {
  private readonly routes: RouteDefinition[] = [];

  constructor(private readonly services: ApiServices) {}

  register(
    method: HttpMethod,
    pattern: string,
    handler: (context: RouteContext) => Promise<void> | void
  ): void {
    this.routes.push({ method, pattern, handler });
  }

  async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    try {
      const method = request.method as HttpMethod | undefined;
      const url = new URL(request.url ?? "/", "http://localhost");
      const pathname = url.pathname;

      const route = this.routes.find((candidate) => {
        if (candidate.method !== method) {
          return false;
        }

        return matchRoute(candidate.pattern, pathname) !== null;
      });

      if (!method || !route) {
        throw new NotFoundError(`No route found for ${request.method} ${pathname}.`);
      }

      const match = matchRoute(route.pattern, pathname);

      if (!match) {
        throw new NotFoundError(`No route found for ${request.method} ${pathname}.`);
      }

      await route.handler({
        request,
        response,
        params: match.params,
        pathname: match.pathname,
        url,
        services: this.services
      });
    } catch (error) {
      sendError(response, error);
    }
  }
}
