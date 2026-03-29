import { Pool } from "pg";
import type { AppConfig } from "../config.js";

export function createPostgresPool(
  database: NonNullable<AppConfig["database"]>
): Pool {
  return new Pool({
    connectionString: database.url,
    max: database.poolMax
  });
}
