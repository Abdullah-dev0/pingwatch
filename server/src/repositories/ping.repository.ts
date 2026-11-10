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

// --- used by the AI chat tools and incident detection ---------------------------
// Fixed queries with parameters: the LLM picks the filters, it never writes SQL.

export interface PingFilter {
	from: string; // ISO time
	to: string;
	onlyFailures: boolean;
	sortBy: "newest" | "slowest" | "fastest";
	limit: number;
}

export interface PingSummaryRow {
	id: number;
	createdAt: string;
	ok: boolean;
	statusCode: number | null;
	responseTimeMs: number;
	error: string | null;
}

const ORDER_BY: Record<PingFilter["sortBy"], string> = {
	newest: "created_at DESC",
	slowest: "response_time_ms DESC",
	fastest: "response_time_ms ASC",
};

// no request/response bodies here: they'd cost tokens and the model doesn't need them
export async function findPings(filter: PingFilter): Promise<PingSummaryRow[]> {
	const { rows } = await pool.query<PingSummaryRow>(
		`SELECT id, created_at AS "createdAt", ok, status_code AS "statusCode",
			response_time_ms AS "responseTimeMs", error
		FROM ping_results
		WHERE created_at BETWEEN $1 AND $2 AND (NOT $3::boolean OR NOT ok)
		ORDER BY ${ORDER_BY[filter.sortBy]}
		LIMIT $4`,
		[filter.from, filter.to, filter.onlyFailures, filter.limit],
	);
	return rows;
}

export interface PingStats {
	total: number;
	failures: number;
	avgMs: number | null;
	minMs: number | null;
	maxMs: number | null;
	p95Ms: number | null;
}

// response times only count successful pings; a timeout's 10s would skew them
export async function getPingStats(from: string, to: string): Promise<PingStats> {
	const { rows } = await pool.query<PingStats>(
		`SELECT
			count(*)::int AS total,
			count(*) FILTER (WHERE NOT ok)::int AS failures,
			round(avg(response_time_ms) FILTER (WHERE ok))::int AS "avgMs",
			min(response_time_ms) FILTER (WHERE ok) AS "minMs",
			max(response_time_ms) FILTER (WHERE ok) AS "maxMs",
			round(percentile_cont(0.95) WITHIN GROUP (ORDER BY response_time_ms) FILTER (WHERE ok))::int AS "p95Ms"
		FROM ping_results
		WHERE created_at BETWEEN $1 AND $2`,
		[from, to],
	);
	return rows[0]!;
}

// average of successful pings over the 24h before this one
export async function getBaseline(beforeId: number): Promise<{ avgMs: number | null; samples: number }> {
	const { rows } = await pool.query<{ avgMs: number | null; samples: number }>(
		`SELECT round(avg(response_time_ms))::int AS "avgMs", count(*)::int AS samples
		FROM ping_results
		WHERE ok AND id < $1 AND created_at > now() - interval '24 hours'`,
		[beforeId],
	);
	return rows[0]!;
}
