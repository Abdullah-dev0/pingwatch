import type { LanguageModelUsage } from "ai";
import { CHAT_CACHE_TTL_MS, HOURLY_LLM_CALL_LIMIT } from "../config/constants.js";
import { env } from "../config/env.js";
import { costUsd } from "../lib/gemini.js";
import { logger } from "../lib/logger.js";
import { getCallTimesLastHour, getUsageTotals, type LlmCallKind, saveLlmCall } from "../repositories/llm.repository.js";

// When each Gemini call of the last hour started. Kept in memory, not read from the database per call,
// so that "is there a slot?" and "take it" happen in one step with no await in between:
// two requests arriving together can't both take the last slot. Works because there is one server process.
let recentCalls: number[] = [];

// calls made before a restart still count
export async function loadRecentCalls(): Promise<void> {
	recentCalls = await getCallTimesLastHour();
}

export function callsLeft(): number {
	recentCalls = recentCalls.filter((startedAt) => startedAt > Date.now() - 3600_000);
	return Math.max(0, HOURLY_LLM_CALL_LIMIT - recentCalls.length);
}

// call right before every Gemini call; false when the hour is full
export function takeSlot(): boolean {
	if (callsLeft() === 0) return false;
	recentCalls.push(Date.now());
	return true;
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
	return { ...(await getUsageTotals()), limit: HOURLY_LLM_CALL_LIMIT, model: env.GEMINI_MODEL };
}

// --- cache: same first question within the TTL = same answer, no Gemini call ---
// No size cap needed: the hourly limit means at most ~20 new answers an hour.
const cache = new Map<string, { answer: string; expiresAt: number }>();

export function getCachedAnswer(question: string): string | undefined {
	const hit = cache.get(question.trim().toLowerCase());
	return hit && hit.expiresAt > Date.now() ? hit.answer : undefined;
}

export function cacheAnswer(question: string, answer: string): void {
	cache.set(question.trim().toLowerCase(), { answer, expiresAt: Date.now() + CHAT_CACHE_TTL_MS });
}
