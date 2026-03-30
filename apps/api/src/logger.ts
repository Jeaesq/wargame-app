export function logInfo(message: string, details?: Record<string, unknown>) {
  console.log(formatLog("INFO", message, details));
}

export function logError(message: string, details?: Record<string, unknown>) {
  console.error(formatLog("ERROR", message, details));
}

function formatLog(
  level: "INFO" | "ERROR",
  message: string,
  details?: Record<string, unknown>
) {
  if (!details || Object.keys(details).length === 0) {
    return `[${level}] ${message}`;
  }

  return `[${level}] ${message} ${JSON.stringify(details)}`;
}
