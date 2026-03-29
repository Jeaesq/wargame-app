import type { ZodType } from "zod";
import { ValidationError } from "../errors/app-error.js";

export function validateWithSchema<T>(
  schema: ZodType<T>,
  input: unknown,
  message: string
): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ValidationError(message, {
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message
      }))
    });
  }

  return result.data;
}
