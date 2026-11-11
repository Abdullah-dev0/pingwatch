import { pool } from "../db/pool.js";

export type Severity = "low" | "medium" | "high";

export interface NewIncident {
	pingId: number;
	endpoint: string;
	severity: Severity;
	responseTimeMs: number;
	averageMs: number;
	summary: string;
	rootCauses: string[];
	recommendations: string[];
	generatedBy: "llm" | "template";
}

export interface Incident extends NewIncident {
	id: number;
	createdAt: string;
}

const COLUMNS = `
	id,
	created_at       AS "createdAt",
	ping_id          AS "pingId",
	endpoint,
	severity,
	response_time_ms AS "responseTimeMs",
	average_ms       AS "averageMs",
	summary,
	root_causes      AS "rootCauses",
	recommendations,
	generated_by     AS "generatedBy"`;

export async function saveIncident(incident: NewIncident): Promise<Incident> {
	const { rows } = await pool.query<Incident>(
		`INSERT INTO incidents
			(ping_id, endpoint, severity, response_time_ms, average_ms, summary, root_causes, recommendations, generated_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING ${COLUMNS}`,
		[
			incident.pingId,
			incident.endpoint,
			incident.severity,
			incident.responseTimeMs,
			incident.averageMs,
			incident.summary,
			JSON.stringify(incident.rootCauses),
			JSON.stringify(incident.recommendations),
			incident.generatedBy,
		],
	);
	return rows[0]!;
}

// for the chat: incidents in a time range, newest first, without the long report fields
export async function findIncidents(from: string, to: string, limit: number) {
	const { rows } = await pool.query(
		`SELECT created_at AS "createdAt", severity, response_time_ms AS "responseTimeMs", average_ms AS "medianMs", summary
		FROM incidents WHERE created_at BETWEEN $1 AND $2 ORDER BY created_at DESC LIMIT $3`,
		[from, to, limit],
	);
	return rows;
}

export async function listIncidents(limit: number): Promise<Incident[]> {
	const { rows } = await pool.query<Incident>(
		`SELECT ${COLUMNS} FROM incidents ORDER BY id DESC LIMIT $1`,
		[limit],
	);
	return rows;
}
