import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { env } from "~/env";

/**
 * Run database migrations programmatically.
 * This script is non-interactive and suitable for CI/CD.
 *
 * Usage: bun run src/server/db/migrate.ts
 */
async function runMigrations() {
  console.log("🔄 Running database migrations...");

  // Create a dedicated connection for migrations
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
