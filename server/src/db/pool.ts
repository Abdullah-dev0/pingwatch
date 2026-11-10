import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

// Neon drops idle connections when it suspends; without this listener that crashes the process
pool.on("error", (err) => logger.error({ err }, "idle db client error"));

// creates the table on startup if it doesn't exist yet
export async function initDb(): Promise<void> {
	const schemaPath = path.join(import.meta.dirname, "../../db/schema.sql");
	await pool.query(await readFile(schemaPath, "utf8"));
}
