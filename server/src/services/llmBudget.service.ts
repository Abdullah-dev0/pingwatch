import type { LanguageModelUsage } from "ai";
import { env } from "../config/env.js";
import { costUsd } from "../lib/gemini.js";
import { logger } from "../lib/logger.js";
import { countCallsLastHour, getUsageTotals, type LlmCallKind, saveLlmCall } from "../repositories/llm.repository.js";

export const HOURLY_LIMIT = 20; // from the brief: max 20 LLM calls per hour

export async function callsLeft(): Promise<number> {
	return Math.max(0, HOURLY_LIMIT - (await countCallsLastHour()));
}

// one row per Gemini call; a failed log must not break the answer
export async function recordCall(kind: LlmCallKind, usage: LanguageModelUsage): Promise<void> {
	const input = usage.inputTokens ?? 0;
	const output = usage.outputTokens ?? 0;
	await saveLlmCall({ kind, inputTokens: input, outputTokens: output, costUsd: costUsd(input, output) }).catch((err) =>
		logger.error({ err }, "Could not record LLM usage"),
	);
}

export async function getUsage() {
	return { ...(await getUsageTotals()), limit: HOURLY_LIMIT, model: env.GEMINI_MODEL };
}

// --- cache: same first question within 5 min = same answer, no Gemini call ---
// 5 minutes because that's how often new data arrives.
// No size cap needed: the hourly limit means at most ~20 new answers an hour.
const cache = new Map<string, { answer: string; expiresAt: number }>();

export function getCachedAnswer(question: string): string | undefined {
	const hit = cache.get(question.trim().toLowerCase());
	return hit && hit.expiresAt > Date.now() ? hit.answer : undefined;
}

export function cacheAnswer(question: string, answer: string): void {
	cache.set(question.trim().toLowerCase(), { answer, expiresAt: Date.now() + 5 * 60 * 1000 });
}
