export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(404, "NOT_FOUND", message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, details?: unknown) {
    super(403, "FORBIDDEN", message, details);
  }
}

export class ProviderInvocationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(502, "PROVIDER_INVOCATION_ERROR", message, details);
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;
