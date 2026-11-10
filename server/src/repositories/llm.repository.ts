import { pool } from "../db/pool.js";

export type LlmCallKind = "chat" | "incident";

export interface LlmCall {
	kind: LlmCallKind;
	inputTokens: number;
	outputTokens: number;
	costUsd: number;
}

export async function saveLlmCall(call: LlmCall): Promise<void> {
	await pool.query("INSERT INTO llm_usage (kind, input_tokens, output_tokens, cost_usd) VALUES ($1, $2, $3, $4)", [
		call.kind,
		call.inputTokens,
		call.outputTokens,
		call.costUsd,
	]);
}

// when the calls of the last hour were made (read once, on startup)
export async function getCallTimesLastHour(): Promise<number[]> {
	const { rows } = await pool.query<{ created_at: Date }>(
		"SELECT created_at FROM llm_usage WHERE created_at > now() - interval '1 hour'",
	);
	return rows.map((row) => row.created_at.getTime());
}

export interface UsageTotals {
	callsLastHour: number;
	tokensToday: number;
	costTodayUsd: number;
	costTotalUsd: number;
}

export async function getUsageTotals(): Promise<UsageTotals> {
	const { rows } = await pool.query<UsageTotals>(`
		SELECT
			count(*) FILTER (WHERE created_at > now() - interval '1 hour')::int AS "callsLastHour",
			coalesce(sum(input_tokens + output_tokens) FILTER (WHERE created_at > now() - interval '24 hours'), 0)::int AS "tokensToday",
			coalesce(sum(cost_usd) FILTER (WHERE created_at > now() - interval '24 hours'), 0)::float AS "costTodayUsd",
			coalesce(sum(cost_usd), 0)::float AS "costTotalUsd"
		FROM llm_usage`);
	return rows[0]!;
}
