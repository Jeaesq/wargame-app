import { ZodError } from "zod";
import { AppError, ProviderInvocationError } from "../errors/app-error.js";

type ProviderFailureCategory =
  | "schema_compatibility"
  | "api_request"
  | "response_validation"
  | "unknown";

type ProviderFailureStage =
  | "schema_construction"
  | "api_request"
  | "response_validation"
  | "unknown";

export function classifyProviderFailure(error: unknown): {
  category: ProviderFailureCategory;
  stage: ProviderFailureStage;
} {
  if (error instanceof ProviderInvocationError) {
    const failureStage = getFailureStage(error.details);

    if (failureStage === "schema_construction") {
      return {
        category: "schema_compatibility",
        stage: failureStage
      };
    }

    if (failureStage === "response_validation") {
      return {
        category: "response_validation",
        stage: failureStage
      };
    }

    return {
      category: "api_request",
      stage: failureStage === "api_request" ? failureStage : "unknown"
    };
  }

  if (error instanceof ZodError) {
    return {
      category: "response_validation",
      stage: "response_validation"
    };
  }

  return {
    category: "unknown",
    stage: "unknown"
  };
}

export function summarizeProviderFailure(error: unknown): Record<string, unknown> {
  const classification = classifyProviderFailure(error);

  return {
    failureCategory: classification.category,
    failureStage: classification.stage,
    errorCode: error instanceof AppError ? error.code : undefined,
    reason: summarizeFailureReason(error),
    details: summarizeErrorDetails(error)
  };
}

function summarizeFailureReason(error: unknown): string {
  if (error instanceof ZodError) {
    return "Provider output failed runtime schema validation.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "unknown";
}

function summarizeErrorDetails(error: unknown): unknown {
  if (error instanceof ZodError) {
    return {
      issueCount: error.issues.length,
      issues: error.issues.slice(0, 5).map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    };
  }

  if (error instanceof AppError) {
    return error.details;
  }

  return undefined;
}

function getFailureStage(details: unknown): ProviderFailureStage {
  const failureStage =
    details && typeof details === "object" && "failureStage" in details
      ? details.failureStage
      : undefined;

  if (
    failureStage === "schema_construction" ||
    failureStage === "api_request" ||
    failureStage === "response_validation"
  ) {
    return failureStage;
  }

  return "unknown";
}
