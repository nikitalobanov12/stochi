import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

type Db = ReturnType<typeof createDb>;

function requireDatabaseUrl(): string {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required to use the database. " +
        "If you are running build/test without env vars, set SKIP_ENV_VALIDATION=1 and avoid importing db at runtime.",
    );
  }
  return url;
}

function createDb() {
  /**
   * Automatically switch between:
   * - Local Docker Postgres (TCP via postgres-js) for development
   * - Neon serverless driver (HTTP) for production
   *
   * Detection: Neon connection strings contain "neon.tech"
   */
  const databaseUrl = requireDatabaseUrl();
  const isNeon = databaseUrl.includes("neon.tech");

  if (isNeon) {
    // Production: Use Neon serverless driver over HTTP
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema });
  }

  // Local development: Use postgres-js with TCP connection
  // Cache connection in development to avoid creating new connections on HMR
  const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
  };

  const conn = globalForDb.conn ?? postgres(databaseUrl);
  if (env.NODE_ENV !== "production") globalForDb.conn = conn;

  return drizzlePostgres(conn, { schema });
}

let cachedDb: Db | null = null;
function getDb(): Db {
  cachedDb ??= createDb();
  return cachedDb;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    return (getDb() as unknown as Record<PropertyKey, unknown>)[prop];
  },
}) as Db;
