import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { getRequiredDatabaseConfig } from "../config.js";

const migrationsDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  "migrations"
);

async function ensureMigrationsTable(pool: Pool) {
  await pool.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function run() {
  const database = getRequiredDatabaseConfig();
  const pool = new Pool({
    connectionString: database.url,
    max: database.poolMax
  });

  try {
    await ensureMigrationsTable(pool);

    const applied = await pool.query<{ name: string }>(
      "select name from schema_migrations"
    );
    const appliedNames = new Set(applied.rows.map((row) => row.name));
    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (appliedNames.has(file)) {
        continue;
      }

      const sql = await readFile(join(migrationsDirectory, file), "utf8");
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("insert into schema_migrations (name) values ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Applied migration ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    console.log("Database migrations are up to date.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Database migration failed.");
  console.error(error);
  process.exit(1);
});
