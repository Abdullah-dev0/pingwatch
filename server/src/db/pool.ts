import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { env } from "../config/env.js";

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

// creates the table on startup if it doesn't exist yet
export async function initDb(): Promise<void> {
	const schemaPath = path.join(import.meta.dirname, "../../db/schema.sql");
	await pool.query(await readFile(schemaPath, "utf8"));
}
