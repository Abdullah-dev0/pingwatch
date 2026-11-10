import { pool } from "../db/pool.js";

export type LlmCallKind = "chat" | "incident";

export interface LlmCall {
	kind: LlmCallKind;
	inputTokens: number;
	outputTokens: number;
	costUsd: number;
}

export async function saveLlmCall(call: LlmCall): Promise<void> {
	await pool.query(
		"INSERT INTO llm_usage (kind, input_tokens, output_tokens, cost_usd) VALUES ($1, $2, $3, $4)",
		[call.kind, call.inputTokens, call.outputTokens, call.costUsd],
	);
}

export async function countCallsLastHour(): Promise<number> {
	const { rows } = await pool.query<{ count: number }>(
		"SELECT count(*)::int AS count FROM llm_usage WHERE created_at > now() - interval '1 hour'",
	);
	return rows[0]!.count;
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
