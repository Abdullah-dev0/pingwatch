import { pool } from "../db/pool.js";
import type { PingResult } from "../services/httpbin.service.js";

export interface SavedPing extends PingResult {
	id: number;
	createdAt: string;
}

// snake_case columns -> camelCase fields
const COLUMNS = `
	id,
	created_at       AS "createdAt",
	ok,
	status_code      AS "statusCode",
	response_time_ms AS "responseTimeMs",
	request_payload  AS "requestPayload",
	response_body    AS "responseBody",
	error`;

export async function savePing(result: PingResult): Promise<SavedPing> {
	const { rows } = await pool.query<SavedPing>(
		`INSERT INTO ping_results
			(ok, status_code, response_time_ms, request_payload, response_body, error)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING ${COLUMNS}`,
		[
			result.ok,
			result.statusCode,
			result.responseTimeMs,
			JSON.stringify(result.requestPayload),
			result.responseBody === null ? null : JSON.stringify(result.responseBody),
			result.error,
		],
	);
	return rows[0]!;
}

// newest first
export async function listPings(limit: number, offset: number): Promise<SavedPing[]> {
	const { rows } = await pool.query<SavedPing>(
		`SELECT ${COLUMNS}
		FROM ping_results
		ORDER BY id DESC
		LIMIT $1 OFFSET $2`,
		[limit, offset],
	);
	return rows;
}

export async function countPings(): Promise<number> {
	// count(*) comes back as a string from pg, hence the ::int
	const { rows } = await pool.query<{ count: number }>("SELECT count(*)::int AS count FROM ping_results");
	return rows[0]!.count;
}
