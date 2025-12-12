import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Automatically switch between:
 * - Local Docker Postgres (TCP via postgres-js) for development
 * - Neon serverless driver (HTTP) for production
 *
 * Detection: Neon connection strings contain "neon.tech"
 */
const isNeon = env.DATABASE_URL.includes("neon.tech");

function createDb() {
  if (isNeon) {
    // Production: Use Neon serverless driver over HTTP
    const sql = neon(env.DATABASE_URL);
    return drizzleNeon(sql, { schema });
  }

  // Local development: Use postgres-js with TCP connection
  // Cache connection in development to avoid creating new connections on HMR
  const globalForDb = globalThis as unknown as {
    conn: postgres.Sql | undefined;
  };

  const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
  if (env.NODE_ENV !== "production") globalForDb.conn = conn;

  return drizzlePostgres(conn, { schema });
}

export const db = createDb();
