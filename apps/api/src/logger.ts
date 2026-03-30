export function logInfo(message: string, details?: Record<string, unknown>) {
  console.log(formatLog("INFO", message, details));
}

export function logError(message: string, details?: Record<string, unknown>) {
  console.error(formatLog("ERROR", message, details));
}

export function logWarn(message: string, details?: Record<string, unknown>) {
  console.warn(formatLog("WARN", message, details));
}

function formatLog(
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  details?: Record<string, unknown>
) {
  if (!details || Object.keys(details).length === 0) {
    return `[${level}] ${message}`;
  }

  return `[${level}] ${message} ${JSON.stringify(sanitizeDetails(details))}`;
}

function sanitizeDetails(details: Record<string, unknown>) {
  const sanitizedEntries = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, sanitizeValue(key, value)] as const);

  return Object.fromEntries(sanitizedEntries);
}

function sanitizeValue(key: string, value: unknown): unknown {
  if (typeof value === "string") {
    if (/(api[_-]?key|authorization|prompt|question|input)/i.test(key)) {
      return "[redacted]";
    }

    return value.length > 500 ? `${value.slice(0, 500)}...[truncated]` : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAnonymousValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([nestedKey, nestedValue]) => [
          nestedKey,
          sanitizeValue(nestedKey, nestedValue)
        ])
    );
  }

  return value;
}

function sanitizeAnonymousValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 200 ? `${value.slice(0, 200)}...[truncated]` : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAnonymousValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([nestedKey, nestedValue]) => [
          nestedKey,
          sanitizeValue(nestedKey, nestedValue)
        ])
    );
  }

  return value;
}
