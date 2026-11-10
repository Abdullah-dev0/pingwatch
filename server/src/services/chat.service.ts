import { convertToModelMessages, isStepCount, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { HTTPBIN_URL, MAX_CHAT_STEPS, MAX_PINGS_PER_LOOKUP, PING_TIMEOUT_MS } from "../config/constants.js";
import { env } from "../config/env.js";
import { geminiOptions, model } from "../lib/gemini.js";
import { findPings, getPingStats } from "../repositories/ping.repository.js";
import { recordCall, takeSlot } from "./llmBudget.service.js";

// "every 5 minutes", or seconds when the interval is shorter than a minute
const ms = env.PING_INTERVAL_MS;
const PING_EVERY = ms % 60_000 === 0 ? `${ms / 60_000} minute${ms === 60_000 ? "" : "s"}` : `${Math.round(ms / 1000)} seconds`;

// fixed text first so Gemini can reuse it between calls (implicit caching); changing parts go at the end
const SYSTEM_PROMPT = `You answer questions about an HTTP monitor.
The monitor sends a POST with a small random JSON body to ${HTTPBIN_URL} every ${PING_EVERY} and stores:
time, success (ok), HTTP status code, response time in ms, and an error message for failures.
A ping fails on a timeout (${PING_TIMEOUT_MS / 1000} s), a network error or a non-2xx status.

Rules:
- Use the tools to get data. Never guess numbers.
- Pick the smallest time range that answers the question.
- Each tool call round costs money, so call the tools you need together in one round, not one by one.
- For "why" or "spike" questions, make these calls together, then answer:
  getStats for the period asked, getStats for the 24 hours before the period asked as the baseline (so the spike is not in it),
  and findPings sorted by slowest for the period asked.
- If the baseline has far fewer pings than its length should hold (one every ${PING_EVERY}),
  say the baseline is incomplete and the comparison is weak.
- When asked "why", give likely causes based on the data (time of day, failures nearby, how far from normal),
  and say clearly that it's a likely cause, not a certainty. You cannot see httpbin's servers.
- Show times in the user's timezone, e.g. "2:15 PM".
- If the question is not about this monitoring data, say you can only answer questions about it.
- Keep answers short: a few sentences or a short list. The chat shows plain text, so use no markdown at all
  (no **bold**, no tables, no headings). For a list, start each line with "- ".`;

const FINAL_STEP_INSTRUCTION =
	"You have no tool calls left. Do not call any tool. Answer now using only the tool results above; if they are not enough, say what you found and what is missing.";

const timeRange = {
	from: z.string().describe("Start time, ISO 8601 with timezone offset"),
	to: z.string().describe("End time, ISO 8601 with timezone offset"),
};

const tools = {
	getStats: tool({
		description:
			"Totals for a time range: number of pings, failures, and average / min / max / p95 response time of successful pings.",
		inputSchema: z.object(timeRange),
		execute: ({ from, to }) => getPingStats(from, to),
	}),
	findPings: tool({
		description: "List individual pings in a time range, e.g. the slowest ones or only the failures.",
		inputSchema: z.object({
			...timeRange,
			onlyFailures: z.boolean().describe("true to return failed pings only"),
			sortBy: z.enum(["newest", "slowest", "fastest"]),
			limit: z
				.number()
				.int()
				.min(1)
				.max(MAX_PINGS_PER_LOOKUP)
				.describe(`How many pings to return, at most ${MAX_PINGS_PER_LOOKUP}`),
		}),
		execute: (filter) => findPings(filter),
	}),
};

interface ChatInput {
	messages: UIMessage[];
	timezone: string;
	stepsAllowed: number; // calls left in this hour's budget
	onAnswer: (text: string) => void;
}

export async function streamChatAnswer({ messages, timezone, stepsAllowed, onAnswer }: ChatInput) {
	const maxSteps = Math.min(MAX_CHAT_STEPS, stepsAllowed);

	return streamText({
		model,
		providerOptions: geminiOptions,
		instructions: `${SYSTEM_PROMPT}\n\nCurrent time: ${new Date().toISOString()}. User's timezone: ${timezone}.`,
		messages: await convertToModelMessages(messages),
		tools,
		stopWhen: isStepCount(maxSteps),
		// last allowed step: no more tools, so the model has to write its answer.
		// Gemini ignores toolChoice "none" alone after a few tool calls (the SDK then throws
		// ToolChoiceViolationError), so it also gets an explicit instruction.
		prepareStep: ({ stepNumber, messages }) => {
			// every step is one Gemini call, so every step takes a slot of the hourly limit first
			if (!takeSlot()) throw new Error("Hourly LLM call limit reached"); // other requests took the last slots

			return stepNumber === maxSteps - 1
				? {
						activeTools: [],
						toolChoice: "none",
						messages: [...messages, { role: "user", content: FINAL_STEP_INSTRUCTION }],
					}
				: undefined;
		},
		onStepEnd: ({ usage }) => recordCall("chat", usage),
		onEnd: ({ text }) => {
			if (text) onAnswer(text);
		},
	});
}
